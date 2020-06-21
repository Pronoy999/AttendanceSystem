package com.pw.hyperxchange.visitormanagement.Objects;

import android.os.Parcel;
import android.os.Parcelable;

public class Employee implements Parcelable {
    private int id;
    private String first_name;
    private String last_name;
    private String company;
    private String designation;
    private String location;
    private String phone;
    private String current_status;

    public Employee(int id, String first_name, String last_name, String company, String designation, String location, String phone, String current_status) {
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.company = company;
        this.designation = designation;
        this.location = location;
        this.phone = phone;
        this.current_status = current_status;
    }

    protected Employee(Parcel in) {
        id = in.readInt();
        first_name = in.readString();
        last_name = in.readString();
        company = in.readString();
        designation = in.readString();
        location = in.readString();
        phone = in.readString();
        current_status = in.readString();
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeInt(id);
        dest.writeString(first_name);
        dest.writeString(last_name);
        dest.writeString(company);
        dest.writeString(designation);
        dest.writeString(location);
        dest.writeString(phone);
        dest.writeString(current_status);
    }

    @Override
    public int describeContents() {
        return 0;
    }

    public static final Creator<Employee> CREATOR = new Creator<Employee>() {
        @Override
        public Employee createFromParcel(Parcel in) {
            return new Employee(in);
        }

        @Override
        public Employee[] newArray(int size) {
            return new Employee[size];
        }
    };

    public int getId() {
        return id;
    }

    public Employee setId(int id) {
        this.id = id;
        return this;
    }

    public String getFirstName() {
        return first_name;
    }

    public Employee setFirstName(String first_name) {
        this.first_name = first_name;
        return this;
    }

    public String getLastName() {
        return last_name;
    }

    public Employee setLastName(String last_name) {
        this.last_name = last_name;
        return this;
    }

    public String getCompany() {
        return company;
    }

    public Employee setCompany(String company) {
        this.company = company;
        return this;
    }

    public String getDesignation() {
        return designation;
    }

    public Employee setDesignation(String designation) {
        this.designation = designation;
        return this;
    }

    public String getLocation() {
        return location;
    }

    public Employee setLocation(String location) {
        this.location = location;
        return this;
    }

    public String getPhone() {
        return phone;
    }

    public Employee setPhone(String phone) {
        this.phone = phone;
        return this;
    }

    public String getCurrentStatus() {
        return current_status;
    }

    public Employee setCurrentStatus(String current_status) {
        this.current_status = current_status;
        return this;
    }
}
