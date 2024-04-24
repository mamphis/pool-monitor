const keys = [
    'PIN_DISPLAY_E',
    'PIN_DISPLAY_RS',
    'PIN_DISPLAY_DATA1',
    'PIN_DISPLAY_DATA2',
    'PIN_DISPLAY_DATA3',
    'PIN_DISPLAY_DATA4',
    'PIN_DISPLAY_LIGHT',
    'PIN_BUTTON_SALT',
    'PIN_BUTTON_PUMP',
    'PIN_RELAIS_SALT',
    'PIN_RELAIS_PUMP',
    'PIN_BUTTON_LIGHT',
]

const config = {
    PIN_DISPLAY_E: 6,
    PIN_DISPLAY_RS: 5,
    PIN_DISPLAY_DATA1: 13,
    PIN_DISPLAY_DATA2: 19,
    PIN_DISPLAY_DATA3: 26,
    PIN_DISPLAY_DATA4: 21,
    PIN_DISPLAY_LIGHT: 25,
    PIN_BUTTON_SALT: 14,
    PIN_BUTTON_PUMP: 15,
    PIN_RELAIS_SALT: 3,
    PIN_RELAIS_PUMP: 4,
    PIN_BUTTON_LIGHT: 11,
};

for (const key of keys) {
    if (!(key in process.env)) {
        throw new Error(key + ' is missing in environment variables');
    }

    const value = process.env[key];
    if (!value) {
        throw new Error(key + ' has a null value in environment variables');
    }

    const numValue = parseInt(value);
    if (isNaN(numValue)) {
        throw new Error(key + ' must be a number: ' + value);
    }

    config[key] = numValue;
}


export default config;
