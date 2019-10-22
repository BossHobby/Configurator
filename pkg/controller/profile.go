package controller

import (
	"fmt"
	"strings"
	"time"
)

type Vector [3]float32

type SilverwareRates struct {
	MaxRate   Vector `cbor:"max_rate" json:"max_rate"`
	AngleExpo Vector `cbor:"angle_expo" json:"angle_expo"`
	AcroExpo  Vector `cbor:"acro_expo" json:"acro_expo"`
}

type BetaflightRates struct {
	RcRate    Vector `cbor:"rc_rate" json:"rc_rate"`
	SuperRate Vector `cbor:"super_rate" json:"super_rate"`
	Expo      Vector `cbor:"expo" json:"expo"`
}

type Rates struct {
	Mode              uint8           `cbor:"mode" json:"mode"`
	Silverware        SilverwareRates `cbor:"silverware" json:"silverware"`
	Betaflight        BetaflightRates `cbor:"betaflight" json:"betaflight"`
	LevelMaxAngle     float32         `cbor:"level_max_angle" json:"level_max_angle"`
	LowRateMulitplier float32         `cbor:"low_rate_mulitplier" json:"low_rate_mulitplier"`
	SticksDeadband    float32         `cbor:"sticks_deadband" json:"sticks_deadband"`
}

type PIDRates struct {
	KP Vector `cbor:"kp" json:"kp"`
	KI Vector `cbor:"ki" json:"ki"`
	KD Vector `cbor:"kd" json:"kd"`
}

type StickRates struct {
	Accelerator Vector `cbor:"accelerator" json:"accelerator"`
	Transition  Vector `cbor:"transition" json:"transition"`
}

type PID struct {
	PIDProfile   uint8        `cbor:"pid_profile" json:"pid_profile"`
	PIDRates     []PIDRates   `cbor:"pid_rates" json:"pid_rates"`
	StickProfile uint8        `cbor:"stick_profile" json:"stick_profile"`
	StickRates   []StickRates `cbor:"stick_rates" json:"stick_rates"`
}

type Motor struct {
	InvertYaw       uint8   `cbor:"invert_yaw" json:"invert_yaw"`
	DigitalIdle     float32 `cbor:"digital_idle" json:"digital_idle"`
	GyroOrientation uint8   `cbor:"gyro_orientation" json:"gyro_orientation"`
}

type Voltage struct {
	LipoCellCount            uint8   `cbor:"lipo_cell_count" json:"lipo_cell_count"`
	PidVoltageCompensation   uint8   `cbor:"pid_voltage_compensation" json:"pid_voltage_compensation"`
	VBattLow                 float32 `cbor:"vbattlow" json:"vbattlow"`
	ActualBatteryVoltage     float32 `cbor:"actual_battery_voltage" json:"actual_battery_voltage"`
	ReportedTelemetryVoltage float32 `cbor:"reported_telemetry_voltage" json:"reported_telemetry_voltage"`
}

type Channel struct {
	Aux []uint `cbor:"aux" json:"aux"`
}

type Metadata struct {
	Name     string `cbor:"name" json:"name"`
	Datetime uint32 `cbor:"datetime" json:"datetime"`
}

type Profile struct {
	Meta    Metadata `cbor:"meta" json:"meta"`
	Channel Channel  `cbor:"channel" json:"channel"`
	Motor   Motor    `cbor:"motor" json:"motor"`
	Voltage Voltage  `cbor:"voltage" json:"voltage"`
	Rate    Rates    `cbor:"rate" json:"rate"`
	PID     PID      `cbor:"pid" json:"pid"`
}

func (p *Profile) Filename() string {
	return fmt.Sprintf("Profile_%s_%s.cbor",
		strings.Replace(p.Meta.Name, "\x00", "", -1),
		time.Unix(int64(p.Meta.Datetime), 0).Format("2006-01-02"),
	)
}

type Blackbox struct {
	VbatFilter float32 `cbor:"vbat_filter" json:"vbat_filter"`

	GyroRaw    [3]float32 `cbor:"gyro_raw" json:"gyro_raw"`
	GyroFilter [3]float32 `cbor:"gyro_filter" json:"gyro_filter"`
	GyroVector [3]float32 `cbor:"gyro_vector" json:"gyro_vector"`

	RxRaw    [4]float32 `cbor:"rx_raw" json:"rx_raw"`
	RxFilter [4]float32 `cbor:"rx_filter" json:"rx_filter"`
	RxAux    []uint     `cbor:"rx_aux" json:"rx_aux"`

	AccelRaw    [3]float32 `cbor:"accel_raw" json:"accel_raw"`
	AccelFilter [3]float32 `cbor:"accel_filter" json:"accel_filter"`
}

type PidRateProfile struct {
	Index uint32   `cbor:"index" json:"index"`
	Name  string   `cbor:"name" json:"name"`
	Rate  PIDRates `cbor:"rate" json:"rate"`
}
