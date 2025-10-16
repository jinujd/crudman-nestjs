# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-01-16

### Fixed
- **Uniqueness validation now works correctly** - Fixed critical issue where `fieldsForUniquenessValidation` was not being properly preserved in section configurations
- **Deep merge logic for @UseCrud decorator** - Implemented proper deep merging to prevent empty section objects from overwriting detailed configurations
- **Section configuration preservation** - Multiple controllers registering with empty sections no longer overwrite existing detailed configurations

### Technical Details
- Fixed `@UseCrud` decorator's merging logic to preserve existing detailed configurations
- Added deep merge function that only merges non-empty objects into existing configurations
- Prevented empty objects from overwriting detailed section configurations like `fieldsForUniquenessValidation`
- Added comprehensive debug logging for troubleshooting configuration merging

### Breaking Changes
- None

### Migration Guide
- No migration required - this is a bug fix that restores expected functionality

## [1.3.1] - Previous Release

### Fixed
- Various bug fixes and improvements

## [1.3.0] - Previous Release

### Added
- Initial release with basic CRUD functionality
