# Utilities Directory (`server/utils/`)

This directory houses helper scripts and external API configurations.

## Purpose
Maintains utility configurations (such as cloud storage setups and OTP generators) that can be imported across controllers and services.

## Responsibilities
* **Cloud Storage Configuration (`cloudinary.js`)**: Configures Cloudinary connection settings, handles image/video size validations, and exports multer storage configurations.
* **OTP Generator (`generateOTP.js`)**: Generates 6-digit numeric codes and sets expiration parameters for authentication steps.

## Dependencies
* `cloudinary` - cloud storage API wrapper
* `multer-storage-cloudinary` - Multer storage engine
* `crypto` - security helpers

## Important Files
* [cloudinary.js](file:///d:/campus_media/server/utils/cloudinary.js): Configures Cloudinary and exports Multer upload helpers.
* [generateOTP.js](file:///d:/campus_media/server/utils/generateOTP.js): Generates verification codes.

## Used By
* Called in controllers (like `authController.js` and `mediaController.js`) and routes (like `mediaRoutes.js`).

## Future Improvements
* Set up mock Cloudinary testing engines to verify uploads locally without calling live cloud storage APIs.
* Implement structured rate-limiting rules for OTP generation requests.

## Common Errors
* **Upload Limits Exceeded**: Uploading files larger than Cloudinary limits throws exceptions. Handled by configuring Multer size limits before uploading files to the cloud.
