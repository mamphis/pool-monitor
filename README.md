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
**v0.0.4-rc3** - __20.05.2021__
- Formatted the system view
    - Make the view uniform to other views

**v0.0.4-rc2** - __20.05.2021__
- Removed the static served content from repository
    - Use the npm packages instead

**v0.0.4-rc1** - __20.05.2021__
- Removed the update logic from this application
    - Created a new npm package `@pcsmw/node-app-updater`
    - Use this package to update the application now

**v0.0.3** - __19.05.2021__
- Log the source of a device state change.
    - Logs weather the device was triggered from a button, the web or a trigger
    - Display the log with timestamps in the web interface.

**v0.0.3-rc3** - __18.05.2021__
- Added Weekdays to Recurrent Trigger
    - Specify the days of the week on which the trigger should run

**v0.0.3-rc2** - __18.05.2021__
- Removed downloaded scripts and added jQuery and Apexcharts to npm packages to reduce size of repository

**v0.0.3.rc1** - __18.05.2021__
- Added Button to force a check if new versions are available

**v0.0.2** - _17.05.2021_
- Added disabling of trigger
    - Triggers can be disabled through the webinterface
    - Disabled triggers do not run
    - Disabled triggers do not show the next invocation time in the webinterface