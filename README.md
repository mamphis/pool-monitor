# pool-monitor

## Roadmap

- [x] Connect LCD Display
- [x] Connect Temperature Sensor
- [x] Connect Buttons to toggle relais / devices
- [x] Display state of connected devices in display
- [x] Create a WebServer which can talk to the application
- [ ] Login into the webserver
- [x] View State of Sensors and Conencted Devices
- [x] Create Flow on WebSite
    - At 21:00
        - If Pump = 'off'
            - Pump := 'on'
    - At 00:00
        - If Pump = 'on'
            - Pump := 'off'
    
    - Trigger
        - Time
    - Condition
    - Action
- [x] Logging of temperature values
- [x] Toggle state of devices manually over the website
- [x] Toggle Light of LCD Display when a button is pressed

## Changelog

**v0.0.3.rc1** - __18.05.2021__
- Added Button to force a check if new versions are available

**v0.0.2** - _17.05.2021_
- Added disabling of trigger
    - Triggers can be disabled through the webinterface
    - Disabled triggers do not run
    - Disabled triggers do not show the next invocation time in the webinterface