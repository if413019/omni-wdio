# Omni-WDIO Mobile Automation Framework

A mobile test automation framework for testing mobile applications on Android and iOS. Built with WebdriverIO and Appium.

## Features

- Page Object Model pattern for improved test maintainability
- Support for both Android and iOS platforms
- Environment-specific configuration
- Allure reporting integration
- **Parallel test execution** with device and test data management
- **Appium Device Farm integration** for distributed test execution

## Setup

### Prerequisites

- Node.js (v16 or higher)
- Appium 2.x
- Android SDK (for Android testing)
- Xcode (for iOS testing)
- Real devices or emulators/simulators
- (Optional) Appium Device Farm for distributed testing

### Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
```

## Project Structure

```
├── apps/                   # Mobile app binaries (.apk, .app)
├── config/                 # WebdriverIO configurations
│   ├── wdio.conf.js        # Base configuration
│   ├── wdio.parallel.conf.js # Parallel execution configuration
│   └── wdio.devicefarm.conf.js # Device Farm configuration
├── src/
│   ├── apps/               # App-specific code
│   │   └── sample_app/       # Sample App app
│   │       ├── config/     # Environment configs (.env.dev, .env.qa)
│   │       ├── pages/      # Page objects
│   │       └── tests/      # Test cases
│   ├── base/               # Framework foundation
│   │   ├── BasePage.js     # Base page object class
│   │   ├── BaseTest.js     # Base test class
│   │   ├── PageRegistry.js # Page registry for lazy loading
│   │   └── elementAction.js # Element interaction helpers
│   ├── testData/           # Test data files
│   │   ├── users.json      # User credentials by category
│   │   └── products.json   # Product data by type
│   └── utils/              # Utilities
│       ├── config.js       # Configuration manager
│       ├── deviceManager.js # Local device management
│       ├── deviceFarmManager.js # Device Farm integration
│       ├── parallelReporter.js # Parallel execution reporter
│       ├── remoteOptions.js # WebdriverIO options
│       └── testDataManager.js # Test data management
```

## Running Tests

### Sequential Execution

Run tests sequentially with the following commands:

```bash
# Run all tests for Sample App app on QA environment
npm run test:qa

# Run Sample App app tests on Android
npm run test:sample_app:android:qa

# Run Sample App app tests on iOS
npm run test:sample_app:ios:qa

# Run specific test
npm run test:specific -- --spec src/apps/sample_app/tests/authentication/login.test.js
```

### Parallel Execution (Local Devices)

Run tests in parallel to utilize multiple local devices:

```bash
# Run all Sample App QA tests in parallel on up to 4 devices
npm run test:parallel:sample_app:qa

# Run all Sample App QA tests in parallel on Android devices
npm run test:parallel:sample_app:android:qa

# Run all Sample App QA tests in parallel on iOS devices
npm run test:parallel:sample_app:ios:qa

# Control the maximum number of parallel instances
MAX_INSTANCES=2 npm run test:parallel:sample_app:qa
```

### Parallel Execution (Appium Device Farm)

Run tests in parallel using an Appium Device Farm:

```bash
# Run all Sample App QA tests using Device Farm
npm run test:devicefarm:sample_app:qa

# Run all Sample App QA tests on Android devices via Device Farm
npm run test:devicefarm:sample_app:android:qa

# Run all Sample App QA tests on iOS devices via Device Farm
npm run test:devicefarm:sample_app:ios:qa

# Control the maximum number of parallel instances
MAX_INSTANCES=20 npm run test:devicefarm:sample_app:qa
```

## Parallel Execution Architecture

The framework supports parallel test execution with the following features:

### Device Management

- Dynamic device allocation for tests
- Prevention of device conflicts during parallel execution
- Device lock mechanism to ensure exclusive access
- Integration with Appium Device Farm for distributed testing

### Test Data Management

The framework includes a structured approach to test data management:

#### Test Data Organization

Test data is stored in JSON files in the `src/testData` directory:

```
src/testData/
├── users.json     # Test user credentials by category (valid, invalid, admin)
├── products.json  # Test product data by type
└── ...            # Additional test data files
```

#### Test Data Structure

Test data is organized by type and category:

```json
{
  "users": {
    "valid": [
      {
        "username": "validuser",
        "email": "validuser@example.com",
        "password": "Password123"
      }
    ],
    "invalid": [...],
    "admin": [...]
  }
}
```

#### Test Data Isolation

For parallel execution, the framework includes:
- Isolation of test data to prevent conflicts in parallel runs
- Dynamic generation of unique identifiers for test users
- Data segregation strategies for concurrent test execution
- Centralized loading from JSON files in the `src/testData` directory

#### Using Test Data in Tests

```javascript
// Get a valid user from test data
const validUser = testDataManager.getUser('valid');

// Get a specific product type
const featuredProduct = testDataManager.getProduct('featured');

// Get all users of a specific type
const allAdminUsers = testDataManager.loadTestData('users', 'admin');
```

### Test Execution

Each test receives:
- A dedicated device for the duration of the test
- Isolated test data to prevent conflicts
- Unique test ID for traceability

## Configuration

### Environment Variables

#### Common Variables
- `APP_NAME`: The app to test (default: sample_app)
- `APP_ENV`: Environment to test against (dev, qa, staging)
- `PLATFORM`: Target platform (android, ios)
- `MAX_INSTANCES`: Maximum number of parallel test instances

#### Local Parallel Execution
- `PARALLEL`: Set to 'true' to enable local parallel execution

#### Device Farm Variables
- `DEVICE_FARM_URL`: URL of the Appium Device Farm (default: 'http://localhost:4723')
- `DEVICE_FARM_PORT`: Port of the Appium Device Farm (default: 4723)
- `DEVICE_FARM_API_KEY`: API key for authentication with the Device Farm
- `DEVICE_FARM_USERNAME`: Username for authentication (if not using API key)
- `DEVICE_FARM_PASSWORD`: Password for authentication (if not using API key)

### Local Device Configuration

Edit the device configurations in `config/wdio.parallel.conf.js` to match your available devices:

```javascript
// Android devices
const androidDevices = [
    {
        id: 'emulator-5554',
        deviceName: 'Pixel_5_API_31',
        platformVersion: '12.0',
    },
    // Add more devices...
];

// iOS devices
const iosDevices = [
    {
        udid: 'A4951C44-F23F-4E94-8435-05AA4BA2A87F',
        deviceName: 'iPhone 13',
        platformVersion: '15.0',
    },
    // Add more devices...
];
```

### Appium Device Farm Setup

To use the Device Farm integration:

1. Set up your Appium Device Farm server (e.g., using Appium Grid or a commercial solution)
2. Configure the connection details using environment variables:

```bash
export DEVICE_FARM_URL="http://your-device-farm-url"
export DEVICE_FARM_API_KEY="your-api-key"
```

## Best Practices for Parallel Execution

1. **Isolate Test Data**: Use the testDataManager to isolate test data for each test
2. **Keep Tests Independent**: Ensure tests can run in any order
3. **Manage Device Resources**: Release devices promptly after tests complete
4. **Use Unique Identifiers**: Add unique suffixes to usernames, emails, etc. for parallel runs
5. **Handle Screenshots**: Take screenshots on test failures for debugging
6. **Optimize Device Usage**: For Device Farm execution, consider using dynamic device allocation based on test requirements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request
