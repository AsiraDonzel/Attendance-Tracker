/*
 * ============================================================
 *  AttendTrack — Arduino Uno Firmware
 *  Hardware: AS608 Fingerprint | DS1302 RTC | 4×4 Keypad
 *            16×2 I²C LCD | Green/Red LED | Passive Buzzer
 * ============================================================
 *
 *  PIN MAP (matches wiring table)
 *  ──────────────────────────────────────────────────────────
 *  LCD (I²C)          SDA → A4   |  SCL → A5
 *  AS608 Fingerprint  TX  → D2   |  RX  → D3
 *  DS1302 RTC         CLK → D8   |  DAT → D9  |  RST → A3
 *  Keypad Rows        R1  → D4   |  R2  → A0  |  R3  → A1  |  R4  → A2
 *  Keypad Cols        C1  → D11  |  C2  → D12 |  C3  → D13 |  C4  → D10
 *  Green LED                → D7 (220Ω to anode)
 *  Red LED                  → D5 (220Ω to anode)
 *  Passive Buzzer     +    → D6
 *
 *  REQUIRED LIBRARIES (install via Library Manager):
 *    • LiquidCrystal_I2C   — Frank de Brabander
 *    • Adafruit Fingerprint Sensor Library — Adafruit
 *    • Keypad               — Mark Stanley / Alexander Brevig
 *    • RTC by Makuna        — RtcDS1302 / ThreeWire
 *    • TOTP-Arduino         — lucadentella (provides TOTP.h + sha1.h)
 *
 *  SYSTEM FLOW:
 *    A → Enroll new finger (Admin use only)
 *    B → Mark attendance  (Student use)
 *    D → Delete finger    (Admin use only)
 *
 *  ENROLLMENT stores a fresh 128-bit random secret in EEPROM
 *  keyed by fingerprint slot ID. It also prints the Base32
 *  secret over Serial so it can be copied into the Django
 *  admin panel (StudentProfile.totp_secret field).
 *
 *  MARK ATTENDANCE:
 *    1. Student enters their numeric fingerprint ID on keypad.
 *    2. Places finger on sensor.
 *    3. If matched, Arduino computes TOTP(secret, unix_time).
 *    4. A 6-digit OTP is displayed on the LCD for 10 seconds.
 *    5. Student types this OTP into the web portal within the
 *       30-second TOTP window.
 *
 *  TOTP WINDOW: The DS1302 must be accurate. If clock drift
 *  causes rejections on the server, ensure the RTC is synced
 *  at boot (set SYNC_TIME = true below and upload once).
 * ============================================================
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>
#include <ThreeWire.h>
#include <RtcDS1302.h>
#include <EEPROM.h>
#include <Keypad.h>
#include <sha1.h>
#include <TOTP.h>

// ============================================================
//  CONFIGURATION — EDIT THESE AS NEEDED
// ============================================================

// LCD I²C address: try 0x27, if blank try 0x3F
const uint8_t LCD_ADDR = 0x27;

/*
 * Set SYNC_RTC to true ONCE to burn compile-time into the RTC,
 * then set back to false and re-upload. The RTC holds time on
 * its own CR2032 cell after that.
 */
const bool SYNC_RTC = false;

/*
 * Set DIAG_MODE to true to run an I²C scanner on boot and halt.
 * Useful to confirm your LCD address if the screen stays blank.
 */
const bool DIAG_MODE = false;

// TOTP valid window tolerance (±N steps, each step = 30 s).
// 1 means the server also accepts the previous/next 30-second
// window. Keep at 1 unless the RTC drifts noticeably.
const uint8_t TOTP_WINDOW = 1;   // informational — enforced server-side

// Maximum fingerprint slot ID the AS608 supports (1–127 typical)
const uint8_t MAX_ID = 127;

// EEPROM layout:
//   Byte  0        → init flag (0xAA = initialised)
//   Bytes 1...(MAX_ID * SECRET_LEN) → 16-byte secrets per ID slot
const int SECRET_LEN = 16;   // 128-bit HMAC key
const int EEPROM_INIT_FLAG = 0;
const int EEPROM_INIT_BYTE = 0xAA;
const int EEPROM_DATA_START = 1;

// ============================================================
//  HARDWARE OBJECTS
// ============================================================

// ---------- LCD ----------
LiquidCrystal_I2C lcd(LCD_ADDR, 16, 2);

// ---------- Fingerprint ----------
SoftwareSerial fpSerial(2, 3);   // RX=D2 (from sensor TX), TX=D3 (to sensor RX)
Adafruit_Fingerprint finger(&fpSerial);

// ---------- RTC ----------
ThreeWire rtcWire(9, 8, A3);     // DAT=D9, CLK=D8, RST=A3
RtcDS1302<ThreeWire> rtc(rtcWire);

// ---------- Keypad ----------
const byte ROWS = 4, COLS = 4;
char keys[ROWS][COLS] = {
    {'1', '2', '3', 'A'},
    {'4', '5', '6', 'B'},
    {'7', '8', '9', 'C'},
    {'*', '0', '#', 'D'}
};
byte rowPins[ROWS] = {4, A0, A1, A2};
byte colPins[COLS] = {11, 12, 13, 10};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// ---------- Feedback ----------
const int PIN_GREEN  = 7;
const int PIN_RED    = 5;
const int PIN_BUZZER = 6;

// ============================================================
//  CUSTOM LCD CHARACTERS
// ============================================================
// Lock icon — shown on enrol/delete screens
byte iconLock[8] = {
    0b01110, 0b10001, 0b10001, 0b11111,
    0b11011, 0b11011, 0b11111, 0b00000
};
// Fingerprint icon — shown during scan
byte iconFP[8] = {
    0b00100, 0b01110, 0b10001, 0b10101,
    0b10001, 0b01110, 0b00100, 0b00000
};
// Tick mark — shown on success
byte iconTick[8] = {
    0b00000, 0b00001, 0b00011, 0b10110,
    0b11100, 0b01000, 0b00000, 0b00000
};

// ============================================================
//  PROTOTYPES
// ============================================================
void     eepromInit();
void     showMenu();
void     enrollFinger();
void     markAttendance();
void     deleteFinger();
uint8_t  readID(const char* prompt);
void     feedback(bool ok);
// Two-line flash-string LCD helper
void     lcdMsgP(const __FlashStringHelper* line0,
                 const __FlashStringHelper* line1);
// Single-line convenience overload (line 2 left blank)
void     lcdMsgP(const __FlashStringHelper* line0);
String   toBase32(const uint8_t* data, int len);
unsigned long getUnixTime();
void     runI2CScanner();
void     waitForNoFinger();
// Returns: 1=finger ready, 0=timeout/error, -1=C pressed (cancel/home)
int      waitForFinger(uint16_t timeoutMs);

// ============================================================
//  SETUP
// ============================================================
void setup() {
    Serial.begin(9600);
    delay(300);

    // --- LCD init ---
    lcd.init();
    lcd.backlight();
    lcd.createChar(0, iconLock);
    lcd.createChar(1, iconFP);
    lcd.createChar(2, iconTick);

    lcdMsgP(F("  AttendTrack"), F("  Initialising"));
    delay(1200);

    // --- Diagnostic / I²C scanner ---
    if (DIAG_MODE) {
        runI2CScanner();
        while (true) delay(1000);
    }

    // --- GPIO ---
    pinMode(PIN_GREEN,  OUTPUT);
    pinMode(PIN_RED,    OUTPUT);
    pinMode(PIN_BUZZER, OUTPUT);
    digitalWrite(PIN_GREEN, LOW);
    digitalWrite(PIN_RED,   LOW);

    // --- Fingerprint sensor ---
    lcdMsgP(F("Fingerprint..."), F(""));
    finger.begin(57600);
    delay(50);
    if (finger.verifyPassword()) {
        lcdMsgP(F("Fingerprint"), F("  Sensor OK"));
    } else {
        lcdMsgP(F("Finger SENSOR"), F("  NOT FOUND!"));
        feedback(false);
        while (true) delay(1000);   // halt — cannot continue
    }
    delay(1000);

    // --- RTC ---
    lcdMsgP(F("RTC Clock..."), F(""));
    rtc.Begin();

    if (SYNC_RTC) {
        // Burn compile-time into RTC (use once, then set SYNC_RTC = false)
        RtcDateTime compiled(__DATE__, __TIME__);
        rtc.SetDateTime(compiled);
        lcdMsgP(F("RTC Synced to"), F("Compile Time"));
        delay(1500);
    }

    if (!rtc.IsDateTimeValid()) {
        // Clock lost power — set a safe default so TOTP still works
        // Replace with a real timestamp if known
        rtc.SetDateTime(RtcDateTime(2025, 1, 1, 0, 0, 0));
        lcdMsgP(F("RTC Reset to"), F("2025-01-01"));
        delay(1500);
    } else {
        RtcDateTime now = rtc.GetDateTime();
        char buf[17];
        snprintf(buf, sizeof(buf), "%04d-%02d-%02d",
                 now.Year(), now.Month(), now.Day());
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print(F("RTC OK"));
        lcd.setCursor(0, 1);
        lcd.print(buf);
        delay(1500);
    }

    // --- EEPROM ---
    eepromInit();

    // --- Ready ---
    showMenu();
}

// ============================================================
//  MAIN LOOP
// ============================================================
void loop() {
    char key = keypad.getKey();
    if (!key) return;

    switch (key) {
        case 'A': enrollFinger();   showMenu(); break;
        case 'B': markAttendance(); showMenu(); break;
        case 'C': showMenu(); break;            // C = go home from anywhere
        case 'D': deleteFinger();   showMenu(); break;
        default: break;
    }
}

// ============================================================
//  SHOW MENU
// ============================================================
void showMenu() {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(F("A:Enrol  B:Mark"));
    lcd.setCursor(0, 1);
    lcd.print(F("D:Delete"));
}

// ============================================================
//  ENROL FINGERPRINT
// ============================================================
void enrollFinger() {
    uint8_t id = readID("Enrol ID (1-127)");
    if (id == 0) {
        lcdMsgP(F("Cancelled"));
        delay(1000);
        return;
    }

    // --- First scan ---
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.write(byte(1));   // fingerprint icon
    lcd.print(F(" Place Finger"));
    lcd.setCursor(0, 1);
    lcd.print(F("ID: "));
    lcd.print(id);

    {
        int fp = waitForFinger(15000);
        if (fp == -1) return;           // C pressed — go home
        if (fp == 0) {
            lcdMsgP(F("Timeout"), F("No finger placed"));
            feedback(false);
            delay(1500);
            return;
        }
    }

    int p = finger.image2Tz(1);
    if (p != FINGERPRINT_OK) {
        lcdMsgP(F("Image Error"), F("Try again"));
        feedback(false);
        delay(1500);
        return;
    }

    // --- Remove finger ---
    lcdMsgP(F("Remove Finger"), F(""));
    delay(600);
    waitForNoFinger();

    // --- Second scan ---
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.write(byte(1));
    lcd.print(F(" Again Please"));
    lcd.setCursor(0, 1);
    lcd.print(F("Confirm finger"));

    {
        int fp = waitForFinger(15000);
        if (fp == -1) return;           // C pressed — go home
        if (fp == 0) {
            lcdMsgP(F("Timeout"), F("Enrol aborted"));
            feedback(false);
            delay(1500);
            return;
        }
    }

    p = finger.image2Tz(2);
    if (p != FINGERPRINT_OK) {
        lcdMsgP(F("Image Error"), F(""));
        feedback(false);
        delay(1500);
        return;
    }

    // --- Create model ---
    p = finger.createModel();
    if (p == FINGERPRINT_ENROLLMISMATCH) {
        lcdMsgP(F("Fingers did not"), F("match. Retry."));
        feedback(false);
        delay(2000);
        return;
    } else if (p != FINGERPRINT_OK) {
        lcdMsgP(F("Model Error"), F(""));
        feedback(false);
        delay(1500);
        return;
    }

    // --- Store model ---
    p = finger.storeModel(id);
    if (p != FINGERPRINT_OK) {
        lcdMsgP(F("Store Failed"), F(""));
        feedback(false);
        delay(1500);
        return;
    }

    // --- Generate & store TOTP secret ---
    uint8_t secret[SECRET_LEN];
    // Seed from floating analog pin + microsecond timer for entropy
    randomSeed((unsigned long)analogRead(A1) * 65537UL + micros());
    for (int i = 0; i < SECRET_LEN; i++) {
        secret[i] = (uint8_t)random(256);
    }

    int addr = EEPROM_DATA_START + (id * SECRET_LEN);
    for (int i = 0; i < SECRET_LEN; i++) {
        EEPROM.update(addr + i, secret[i]);   // update() only writes if changed
    }

    String b32 = toBase32(secret, SECRET_LEN);

    // Print to Serial — Admin copies this into Django admin
    Serial.println(F("=============================="));
    Serial.print(F("ENROLLED  ID   : "));
    Serial.println(id);
    Serial.print(F("TOTP SECRET    : "));
    Serial.println(b32);
    Serial.println(F("Paste this into Django Admin:"));
    Serial.println(F("  StudentProfile → totp_secret"));
    Serial.println(F("=============================="));

    // Show success
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.write(byte(2));   // tick icon
    lcd.print(F(" Enrolled ID:"));
    lcd.print(id);
    lcd.setCursor(0, 1);
    // Show first 12 chars of secret so user can verify
    lcd.print(b32.substring(0, 12));
    lcd.print(F(".."));
    feedback(true);
    delay(3000);
}

// ============================================================
//  MARK ATTENDANCE
// ============================================================
void markAttendance() {
    /*
     * Retry loop — iterates on every wrong-finger or timeout.
     * Exits:  break  on success (OTP shown).
     *         return when id==0 (C pressed in readID) or
     *                when C is pressed while waiting for finger.
     */
    while (true) {

        // --- Get student ID ---
        uint8_t id = readID("Your ID (1-127)");
        if (id == 0) {
            // C pressed during ID entry or empty # pressed
            lcdMsgP(F("Cancelled"));
            delay(800);
            return;
        }

        // --- Prompt for finger (hint: C cancels) ---
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.write(byte(1));   // fingerprint icon
        lcd.print(F(" Scan Finger"));
        lcd.setCursor(0, 1);
        lcd.print(F("C:Home  ID:"));
        lcd.print(id);

        int fp = waitForFinger(10000);
        if (fp == -1) return;        // C pressed — exit to menu
        if (fp == 0) {
            lcdMsgP(F("Timeout"), F("No finger placed"));
            feedback(false);
            delay(1500);
            continue;                // loop — ask for ID again
        }

        // --- Convert image ---
        int p = finger.image2Tz(1);
        if (p != FINGERPRINT_OK) {
            lcdMsgP(F("Image Error"), F("Try again"));
            feedback(false);
            delay(1200);
            continue;                // loop
        }

        // --- Search all stored templates ---
        p = finger.fingerSearch();
        if (p != FINGERPRINT_OK) {
            lcdMsgP(F("No Match Found"), F("Access Denied"));
            feedback(false);
            delay(2000);
            continue;                // loop — ask for ID again
        }

        // finger.fingerID  = matched slot
        // finger.confidence = match score

        // --- Verify matched slot = ID the student entered ---
        if (finger.fingerID != id) {
            // Wrong finger placed for this ID — prompt retry without
            // returning to the main menu
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print(F("Wrong Finger!"));
            lcd.setCursor(0, 1);
            lcd.print(F("Matched: ID "));
            lcd.print(finger.fingerID);
            feedback(false);
            delay(2000);
            lcdMsgP(F("Try Again"), F("Re-enter your ID"));
            delay(1500);
            continue;                // loop — re-enter ID and scan again
        }

        // --- Read TOTP secret from EEPROM ---
        uint8_t secret[SECRET_LEN];
        int addr = EEPROM_DATA_START + (id * SECRET_LEN);
        bool secretEmpty = true;
        for (int i = 0; i < SECRET_LEN; i++) {
            secret[i] = EEPROM.read(addr + i);
            if (secret[i] != 0x00) secretEmpty = false;
        }

        if (secretEmpty) {
            lcdMsgP(F("No Secret Found"), F("Re-enrol needed"));
            feedback(false);
            delay(2500);
            return;                  // fatal — must re-enrol, exit to menu
        }

        // --- Generate TOTP ---
        TOTP totp(secret, SECRET_LEN);
        unsigned long unix_t = getUnixTime();
        // getCode() returns a char* pointing to a zero-padded 6-digit string
        // e.g. "048291". Do NOT store in uint32_t — that captures the pointer
        // address, not the OTP value.
        char* codeStr = totp.getCode(unix_t);

        // --- Display OTP ---
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.write(byte(2));          // tick icon
        lcd.print(F(" ID:"));
        lcd.print(id);
        lcd.print(F(" OK"));
        lcd.setCursor(0, 1);
        lcd.print(F("OTP: "));
        lcd.print(codeStr);          // already exactly 6 digits, e.g. "048291"

        // Serial debug output
        Serial.print(F("Attendance OTP for ID "));
        Serial.print(id);
        Serial.print(F(": "));
        Serial.println(codeStr);
        Serial.print(F("Unix time: "));
        Serial.println(unix_t);

        feedback(true);

        // Countdown 10 s — OTP stays visible
        for (int countdown = 10; countdown >= 0; countdown--) {
            lcd.setCursor(13, 0);
            lcd.print(countdown);
            if (countdown < 10) lcd.print(' ');
            delay(1000);
        }
        break;   // success — exit retry loop, return to menu
    }
}

// ============================================================
//  DELETE FINGERPRINT
// ============================================================
void deleteFinger() {
    uint8_t id = readID("Delete ID (1-127)");
    if (id == 0) {
        lcdMsgP(F("Cancelled"));
        delay(1000);
        return;
    }

    // Confirm: press '#' to confirm or '*' to cancel
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.write(byte(0));   // lock icon
    lcd.print(F(" Delete ID:"));
    lcd.print(id);
    lcd.setCursor(0, 1);
    lcd.print(F("#:Confirm *:No"));

    unsigned long start = millis();
    while (millis() - start < 8000) {
        char key = keypad.getKey();
        if (key == '#') {
            // Proceed with deletion
            if (finger.deleteModel(id) == FINGERPRINT_OK) {
                // Wipe EEPROM slot
                int addr = EEPROM_DATA_START + (id * SECRET_LEN);
                for (int i = 0; i < SECRET_LEN; i++) EEPROM.update(addr + i, 0);

                lcd.clear();
                lcd.setCursor(0, 0);
                lcd.write(byte(2));
                lcd.print(F(" Deleted ID:"));
                lcd.print(id);
                lcd.setCursor(0, 1);
                lcd.print(F("Record cleared"));
                feedback(true);

                Serial.print(F("DELETED fingerprint ID: "));
                Serial.println(id);
            } else {
                lcdMsgP(F("Delete Failed"), F("ID not found?"));
                feedback(false);
            }
            delay(2000);
            return;
        } else if (key == '*') {
            lcdMsgP(F("Cancelled"), F(""));
            delay(1000);
            return;
        }
    }

    // Timeout
    lcdMsgP(F("Timeout"), F("Not deleted"));
    delay(1000);
}

// ============================================================
//  READ NUMERIC ID FROM KEYPAD
//  Returns 0 on abort (A/B/C/D pressed, or no entry + #)
// ============================================================
uint8_t readID(const char* prompt) {
    String idStr = "";
    lcd.clear();
    lcd.setCursor(0, 0);
    // Truncate prompt to 16 chars
    for (int i = 0; i < 16 && prompt[i]; i++) lcd.print(prompt[i]);
    lcd.setCursor(0, 1);

    while (true) {
        char key = keypad.getKey();
        if (!key) continue;

        if (key >= '0' && key <= '9') {
            if (idStr.length() < 3) {
                idStr += key;
                lcd.print(key);
            }
        } else if (key == '#') {
            if (idStr.length() == 0) return 0;   // empty + confirm = abort
            int val = idStr.toInt();
            if (val < 1 || val > MAX_ID) {
                lcd.clear();
                lcd.print(F("ID 1-"));
                lcd.print(MAX_ID);
                lcd.print(F(" only"));
                delay(1500);
                // Re-draw prompt
                lcd.clear();
                lcd.setCursor(0, 0);
                for (int i = 0; i < 16 && prompt[i]; i++) lcd.print(prompt[i]);
                lcd.setCursor(0, 1);
                idStr = "";
                continue;
            }
            return (uint8_t)val;
        } else if (key == '*') {
            // Backspace
            if (idStr.length() > 0) {
                idStr.remove(idStr.length() - 1);
                lcd.setCursor(0, 1);
                lcd.print(F("                "));   // clear line
                lcd.setCursor(0, 1);
                lcd.print(idStr);
            }
        } else {
            // A/B/C/D = abort
            return 0;
        }
    }
}

// ============================================================
//  FEEDBACK  (OK = green + high beep | FAIL = red + low beep)
// ============================================================
void feedback(bool ok) {
    if (ok) {
        digitalWrite(PIN_GREEN, HIGH);
        tone(PIN_BUZZER, 1200, 120);
        delay(130);
        tone(PIN_BUZZER, 1600, 100);
        delay(110);
        noTone(PIN_BUZZER);
        digitalWrite(PIN_GREEN, LOW);
    } else {
        digitalWrite(PIN_RED, HIGH);
        tone(PIN_BUZZER, 300, 400);
        delay(410);
        noTone(PIN_BUZZER);
        digitalWrite(PIN_RED, LOW);
    }
}

// ============================================================
//  WAIT FOR FINGER
//  Returns: 1 = image ready
//           0 = timeout or sensor error
//          -1 = C key pressed (cancel / go home)
// ============================================================
int waitForFinger(uint16_t timeoutMs) {
    unsigned long start = millis();
    while (millis() - start < timeoutMs) {
        // Check keypad every iteration so C is never missed
        char key = keypad.getKey();
        if (key == 'C') return -1;   // user wants to go home

        int p = finger.getImage();
        if (p == FINGERPRINT_OK)     return 1;
        if (p == FINGERPRINT_NOFINGER) continue;
        return 0;                    // sensor error
    }
    return 0;                        // timeout
}

// ============================================================
//  WAIT FOR FINGER TO BE REMOVED
// ============================================================
void waitForNoFinger() {
    while (finger.getImage() != FINGERPRINT_NOFINGER) delay(50);
}

// ============================================================
//  LCD HELPERS
// ============================================================

// Two-line version: both lines supplied by caller
void lcdMsgP(const __FlashStringHelper* line0,
             const __FlashStringHelper* line1) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line0);
    if (line1) {
        lcd.setCursor(0, 1);
        lcd.print(line1);
    }
}

// Single-line convenience: clears line 2
void lcdMsgP(const __FlashStringHelper* line0) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line0);
    lcd.setCursor(0, 1);
    lcd.print(F(""));
}

// ============================================================
//  EEPROM INIT  (marks byte 0 = 0xAA once, clears data area)
// ============================================================
void eepromInit() {
    if (EEPROM.read(EEPROM_INIT_FLAG) != EEPROM_INIT_BYTE) {
        for (int i = EEPROM_DATA_START; i < EEPROM.length(); i++) {
            EEPROM.update(i, 0);
        }
        EEPROM.write(EEPROM_INIT_FLAG, EEPROM_INIT_BYTE);
        Serial.println(F("EEPROM initialised (first boot)."));
    }
}

// ============================================================
//  BASE-32 ENCODE  (RFC 4648, no padding)
// ============================================================
String toBase32(const uint8_t* data, int len) {
    static const char alphabet[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    String result;
    result.reserve((len * 8 + 4) / 5);
    int buffer = 0, bitsLeft = 0;
    for (int i = 0; i < len; i++) {
        buffer = (buffer << 8) | data[i];
        bitsLeft += 8;
        while (bitsLeft >= 5) {
            result += alphabet[(buffer >> (bitsLeft - 5)) & 0x1F];
            bitsLeft -= 5;
        }
    }
    if (bitsLeft > 0) {
        result += alphabet[(buffer << (5 - bitsLeft)) & 0x1F];
    }
    return result;
}

// ============================================================
//  GET UNIX TIMESTAMP FROM DS1302 RTC
//  Algorithm: civil-time to days-since-epoch (proleptic Gregorian)
// ============================================================
unsigned long getUnixTime() {
    RtcDateTime now = rtc.GetDateTime();

    unsigned int Y = now.Year();
    unsigned int M = now.Month();
    unsigned int D = now.Day();

    // Civil-date → Unix day count (Gregorian calendar)
    if (M <= 2) { Y--; }
    unsigned long era   = (Y >= 0 ? Y : Y - 399) / 400;
    unsigned int  yoe   = (unsigned int)(Y - era * 400);
    unsigned int  doy   = (153 * (M + (M > 2 ? -3 : 9)) + 2) / 5 + D - 1;
    unsigned int  doe   = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    unsigned long days  = era * 146097UL + doe - 719468UL;

    return days * 86400UL
           + (unsigned long)now.Hour()   * 3600UL
           + (unsigned long)now.Minute() * 60UL
           + (unsigned long)now.Second();
}

// ============================================================
//  I²C SCANNER (diagnostic mode only)
// ============================================================
void runI2CScanner() {
    lcd.clear();
    lcd.print(F("I2C Scanner..."));
    Serial.println(F("--- I2C Scanner ---"));
    int found = 0;
    for (byte addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.print(F("Found: 0x"));
            Serial.println(addr, HEX);
            lcd.setCursor(0, 1);
            lcd.print(F("0x"));
            lcd.print(addr, HEX);
            lcd.print(F("       "));
            delay(1500);
            found++;
        }
    }
    if (found == 0) {
        Serial.println(F("No I2C devices found."));
        lcd.setCursor(0, 1);
        lcd.print(F("None found"));
    }
    Serial.println(F("-------------------"));
    delay(3000);
}
