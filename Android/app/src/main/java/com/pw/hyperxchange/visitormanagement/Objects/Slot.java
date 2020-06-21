package com.pw.hyperxchange.visitormanagement.Objects;

public class Slot {
    private String startTime, endTime;
    private int slotID;
    private boolean isSelected;

    public Slot(String startTime, String endTime, int slotID, boolean isSelected) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.slotID = slotID;
        this.isSelected = isSelected;
    }

    public boolean isSelected() {
        return isSelected;
    }

    public Slot setSelected(boolean selected) {
        isSelected = selected;
        return this;
    }

    public String getStartTime() {
        return startTime;
    }

    public Slot setStartTime(String startTime) {
        this.startTime = startTime;
        return this;
    }

    public String getEndTime() {
        return endTime;
    }

    public Slot setEndTime(String endTime) {
        this.endTime = endTime;
        return this;
    }

    public int getSlotID() {
        return slotID;
    }

    public Slot setSlotID(int slotID) {
        this.slotID = slotID;
        return this;
    }
}
