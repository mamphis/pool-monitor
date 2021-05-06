# pool-monitor

## Roadmap

- [x] Connect LCD Display
- [x] Connect Temperature Sensor
- [x] Connect Buttons to toggle relais / devices
- [x] Display state of connected devices in display
- [x] Create a WebServer which can talk to the application
- [ ] Login into the webserver
- [ ] View State of Sensors and Conencted Devices
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
- [ ] Logging of temperature values
- [ ] Toggle state of devices manually over the website
- [ ] Toggle Light of LCD Display when a button is pressed