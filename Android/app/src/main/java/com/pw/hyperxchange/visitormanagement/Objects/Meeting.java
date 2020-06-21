package com.pw.hyperxchange.visitormanagement.Objects;

public class Meeting {
    private String date, roomName, slotStart, slotEnd, employeeName;

    public Meeting(String date, String roomName, String slotStart, String slotEnd, String employeeName) {
        this.date = date;
        this.roomName = roomName;
        this.slotStart = slotStart;
        this.slotEnd = slotEnd;
        this.employeeName = employeeName;
    }

    public String getDate() {
        return date;
    }

    public Meeting setDate(String date) {
        this.date = date;
        return this;
    }

    public String getRoomName() {
        return roomName;
    }

    public Meeting setRoomName(String roomName) {
        this.roomName = roomName;
        return this;
    }

    public String getSlotStart() {
        return slotStart;
    }

    public Meeting setSlotStart(String slotStart) {
        this.slotStart = slotStart;
        return this;
    }

    public String getSlotEnd() {
        return slotEnd;
    }

    public Meeting setSlotEnd(String slotEnd) {
        this.slotEnd = slotEnd;
        return this;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public Meeting setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
        return this;
    }
}
