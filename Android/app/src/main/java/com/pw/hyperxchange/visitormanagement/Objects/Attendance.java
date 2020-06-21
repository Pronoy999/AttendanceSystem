package com.pw.hyperxchange.visitormanagement.Objects;

public class Attendance {
    private String logType, time, date, location;
    private int employeeID;

    public Attendance(int employeeID, String logType, String time, String date, String location) {
        this.employeeID = employeeID;
        this.logType = logType;
        this.time = time;
        this.date = date;
        this.location = location;
    }

    public int getEmployeeID() {
        return employeeID;
    }

    public void setEmployeeID(int employeeID) {
        this.employeeID = employeeID;
    }

    public String getLogType() {
        return logType;
    }

    public void setLogType(String logType) {
        this.logType = logType;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
