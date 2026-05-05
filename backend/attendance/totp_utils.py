"""
TOTP Verification Utilities (Stubbed)

This module handles OTP verification for student attendance.
Currently stubbed for development until Arduino hardware is ready.

The test student (fingerprint ID 999) accepts OTP code 482391.
All other students receive "OTP verification pending hardware integration".

# TODO: integrate real pyotp when Arduino + RTC hardware is ready
# The flow will be:
#   1. Student scans fingerprint on Arduino device
#   2. Arduino generates TOTP using shared secret + RTC time
#   3. Student enters the 6-digit code on the web portal
#   4. Server verifies using pyotp.TOTP(secret).verify(code)
"""

# import pyotp  # TODO: uncomment when hardware ready


def verify_otp(fingerprint_id, otp_code):
    """
    Verify the OTP code for a student identified by fingerprint_id.

    Args:
        fingerprint_id (int): The student's fingerprint ID from the Arduino device
        otp_code (str): The 6-digit OTP code entered by the student

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
            - (True, None) if OTP is valid
            - (False, error_message) if OTP is invalid or not supported

    # TODO: integrate real pyotp when hardware ready
    # Real implementation would be:
    #   from accounts.models import StudentProfile
    #   student = StudentProfile.objects.get(fingerprint_id=fingerprint_id)
    #   totp = pyotp.TOTP(student.totp_secret)
    #   if totp.verify(otp_code, valid_window=1):
    #       return True, None
    #   else:
    #       return False, 'Invalid OTP code'
    """
    # Stub: only accept fixed code for test student ID 999
    if fingerprint_id == 999:
        if str(otp_code) == '482391':
            return True, None
        else:
            return False, 'Invalid OTP code.'
    else:
        # For all other students, TOTP is not yet implemented
        return False, 'OTP verification pending hardware integration.'
