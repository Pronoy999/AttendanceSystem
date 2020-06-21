package com.startek.fm220.sdk;

public class Params {
    private byte m_AGC;
    private byte m_AEC;

    public Params(byte[] eeprom) {
        this.m_AGC = eeprom[16];
        this.m_AEC = eeprom[19];
    }

    public byte getM_AGC() {
        return m_AGC;
    }

    public Params setM_AGC(byte m_AGC) {
        this.m_AGC = m_AGC;
        return this;
    }

    public byte getM_AEC() {
        return m_AEC;
    }

    public Params setM_AEC(byte m_AEC) {
        this.m_AEC = m_AEC;
        return this;
    }
}