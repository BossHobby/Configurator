package controller

import (
	"fmt"
	"strings"
	"time"

	"github.com/fxamacker/cbor"
)

type Vector [3]float32

type SilverwareRates struct {
	MaxRate   Vector `cbor:"max_rate,omitempty" json:"max_rate"`
	AngleExpo Vector `cbor:"angle_expo,omitempty" json:"angle_expo"`
	AcroExpo  Vector `cbor:"acro_expo,omitempty" json:"acro_expo"`
}

type BetaflightRates struct {
	RcRate    Vector `cbor:"rc_rate,omitempty" json:"rc_rate"`
	SuperRate Vector `cbor:"super_rate,omitempty" json:"super_rate"`
	Expo      Vector `cbor:"expo,omitempty" json:"expo"`
}

type Rates struct {
	Mode              uint8           `cbor:"mode,omitempty" json:"mode"`
	Silverware        SilverwareRates `cbor:"silverware,omitempty" json:"silverware"`
	Betaflight        BetaflightRates `cbor:"betaflight,omitempty" json:"betaflight"`
	LevelMaxAngle     float32         `cbor:"level_max_angle,omitempty" json:"level_max_angle"`
	LowRateMulitplier float32         `cbor:"low_rate_mulitplier,omitempty" json:"low_rate_mulitplier"`
	SticksDeadband    float32         `cbor:"sticks_deadband,omitempty" json:"sticks_deadband"`
}

type PIDRates struct {
	KP Vector `cbor:"kp,omitempty" json:"kp"`
	KI Vector `cbor:"ki,omitempty" json:"ki"`
	KD Vector `cbor:"kd,omitempty" json:"kd"`
}

type AnglePIDRates struct {
	KP float32 `cbor:"kp,omitempty" json:"kp"`
	KD float32 `cbor:"kd,omitempty" json:"kd"`
}

type StickRates struct {
	Accelerator Vector `cbor:"accelerator,omitempty" json:"accelerator"`
	Transition  Vector `cbor:"transition,omitempty" json:"transition"`
}

type ThrottleDTermAttenuation struct {
	TDAActive     uint8   `cbor:"tda_active,omitempty" json:"tda_active"`
	TDABreakpoint float32 `cbor:"tda_breakpoint,omitempty" json:"tda_breakpoint"`
	TDAPercent    float32 `cbor:"tda_percent,omitempty" json:"tda_percent"`
}

type PID struct {
	PIDProfile               uint8                    `cbor:"pid_profile,omitempty" json:"pid_profile"`
	PIDRates                 []PIDRates               `cbor:"pid_rates,omitempty" json:"pid_rates"`
	StickProfile             uint8                    `cbor:"stick_profile,omitempty" json:"stick_profile"`
	StickRates               []StickRates             `cbor:"stick_rates,omitempty" json:"stick_rates"`
	SmallAngle               AnglePIDRates            `cbor:"small_angle,omitempty" json:"small_angle"`
	BigAngle                 AnglePIDRates            `cbor:"big_angle,omitempty" json:"big_angle"`
	ThrottleDTermAttenuation ThrottleDTermAttenuation `cbor:"throttle_dterm_attenuation,omitempty" json:"throttle_dterm_attenuation"`
}

type Motor struct {
	InvertYaw             uint8   `cbor:"invert_yaw,omitempty" json:"invert_yaw"`
	DigitalIdle           float32 `cbor:"digital_idle,omitempty" json:"digital_idle"`
	GyroOrientation       uint8   `cbor:"gyro_orientation,omitempty" json:"gyro_orientation"`
	TorqueBoost           float32 `cbor:"torque_boost,omitempty" json:"torque_boost"`
	ThrottleBoost         float32 `cbor:"throttle_boost,omitempty" json:"throttle_boost"`
	MotorPins             [4]uint `cbor:"motor_pins,omitempty" json:"motor_pins"`
	TurtleThrottlePercent float32 `cbor:"turtle_throttle_percent,omitempty" json:"turtle_throttle_percent"`
}

type Voltage struct {
	LipoCellCount            uint8   `cbor:"lipo_cell_count,omitempty" json:"lipo_cell_count"`
	PidVoltageCompensation   uint8   `cbor:"pid_voltage_compensation,omitempty" json:"pid_voltage_compensation"`
	VBattLow                 float32 `cbor:"vbattlow,omitempty" json:"vbattlow"`
	ActualBatteryVoltage     float32 `cbor:"actual_battery_voltage,omitempty" json:"actual_battery_voltage"`
	ReportedTelemetryVoltage float32 `cbor:"reported_telemetry_voltage,omitempty" json:"reported_telemetry_voltage"`
}

type Channel struct {
	Aux []uint `cbor:"aux,omitempty" json:"aux"`
}

type OSD struct {
	Elements []uint `cbor:"elements,omitempty" json:"elements"`
}

type Serial struct {
	RX         uint `cbor:"rx,omitempty" json:"rx"`
	SmartAudio uint `cbor:"smart_audio,omitempty" json:"smart_audio"`
}

type FilterParameter struct {
	Type       uint8   `cbor:"type,omitempty" json:"type"`
	CutoffFreq float32 `cbor:"cutoff_freq,omitempty" json:"cutoff_freq"`
}

type Filter struct {
	Gyro               []FilterParameter `cbor:"gyro,omitempty" json:"gyro"`
	DTerm              []FilterParameter `cbor:"dterm,omitempty" json:"dterm"`
	DTermDynamicEnable uint8             `cbor:"dterm_dynamic_enable,omitempty" json:"dterm_dynamic_enable"`
	DTermDynamicMin    float32           `cbor:"dterm_dynamic_min,omitempty" json:"dterm_dynamic_min"`
	DTermDynamicMax    float32           `cbor:"dterm_dynamic_max,omitempty" json:"dterm_dynamic_max"`
}

type Metadata struct {
	Name     string `cbor:"name,omitempty" json:"name"`
	Datetime uint32 `cbor:"datetime,omitempty" json:"datetime"`
}

func (m *Metadata) UnmarshalCBOR(data []byte) error {
	type proxy Metadata

	var p proxy
	if err := cbor.Unmarshal(data, &p); err != nil {
		return err
	}

	m.Name = strings.Replace(p.Name, "\x00", "", -1)
	m.Datetime = p.Datetime
	return nil
}

type Profile struct {
	Meta    Metadata `cbor:"meta,omitempty" json:"meta"`
	Channel Channel  `cbor:"channel,omitempty" json:"channel"`
	Motor   Motor    `cbor:"motor,omitempty" json:"motor"`
	Serial  Serial   `cbor:"serial,omitempty" json:"serial"`
	Filter  Filter   `cbor:"filter,omitempty" json:"filter"`
	OSD     OSD      `cbor:"osd,omitempty" json:"osd"`
	Voltage Voltage  `cbor:"voltage,omitempty" json:"voltage"`
	Rate    Rates    `cbor:"rate,omitempty" json:"rate"`
	PID     PID      `cbor:"pid,omitempty" json:"pid"`
}

func (p *Profile) Filename() string {
	return fmt.Sprintf("Profile_%s_%s.cbor",
		strings.Replace(p.Meta.Name, "\x00", "", -1),
		time.Unix(int64(p.Meta.Datetime), 0).Format("2006-01-02"),
	)
}

type TargetInfo struct {
	TargetName          string   `cbor:"target_name,omitempty" json:"target_name"`
	GITVersion          string   `cbor:"git_version,omitempty" json:"git_version"`
	QuicProtocolVersion uint     `cbor:"quic_protocol_version,omitempty" json:"quic_protocol_version"`
	MotorPins           []string `cbor:"motor_pins,omitempty" json:"motor_pins"`
	UsartPorts          []string `cbor:"usart_ports,omitempty" json:"usart_ports"`
}

type Blackbox struct {
	CPULoad    float32 `cbor:"cpu_load,omitempty" json:"cpu_load"`
	VbatFilter float32 `cbor:"vbat_filter,omitempty" json:"vbat_filter"`

	GyroRaw    [3]float32 `cbor:"gyro_raw,omitempty" json:"gyro_raw"`
	GyroFilter [3]float32 `cbor:"gyro_filter,omitempty" json:"gyro_filter"`
	GyroVector [3]float32 `cbor:"gyro_vector,omitempty" json:"gyro_vector"`

	RxRaw    [4]float32 `cbor:"rx_raw,omitempty" json:"rx_raw"`
	RxFilter [4]float32 `cbor:"rx_filter,omitempty" json:"rx_filter"`
	RxAux    []uint     `cbor:"rx_aux,omitempty" json:"rx_aux"`

	AccelRaw    [3]float32 `cbor:"accel_raw,omitempty" json:"accel_raw"`
	AccelFilter [3]float32 `cbor:"accel_filter,omitempty" json:"accel_filter"`
}

type PidRatePreset struct {
	Index uint32   `cbor:"index,omitempty" json:"index"`
	Name  string   `cbor:"name,omitempty" json:"name"`
	Rate  PIDRates `cbor:"rate,omitempty" json:"rate"`
}

type VtxSettings struct {
	Band    uint `cbor:"band,omitempty" json:"band"`
	Channel uint `cbor:"channel,omitempty" json:"channel"`
}
