package quic

import (
	"fmt"
	"strings"
	"time"

	"github.com/fxamacker/cbor/v2"
)

type Vec3 [3]float32
type Vec4 [4]float32

type SilverwareRates struct {
	MaxRate   Vec3 `cbor:"max_rate" json:"max_rate"`
	AngleExpo Vec3 `cbor:"angle_expo" json:"angle_expo"`
	AcroExpo  Vec3 `cbor:"acro_expo" json:"acro_expo"`
}

type BetaflightRates struct {
	RcRate    Vec3 `cbor:"rc_rate" json:"rc_rate"`
	SuperRate Vec3 `cbor:"super_rate" json:"super_rate"`
	Expo      Vec3 `cbor:"expo" json:"expo"`
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
	KP Vec3 `cbor:"kp" json:"kp"`
	KI Vec3 `cbor:"ki" json:"ki"`
	KD Vec3 `cbor:"kd" json:"kd"`
}

type AnglePIDRates struct {
	KP float32 `cbor:"kp" json:"kp"`
	KD float32 `cbor:"kd" json:"kd"`
}

type StickRates struct {
	Accelerator Vec3 `cbor:"accelerator" json:"accelerator"`
	Transition  Vec3 `cbor:"transition" json:"transition"`
}

type ThrottleDTermAttenuation struct {
	TDAActive     uint8   `cbor:"tda_active" json:"tda_active"`
	TDABreakpoint float32 `cbor:"tda_breakpoint" json:"tda_breakpoint"`
	TDAPercent    float32 `cbor:"tda_percent" json:"tda_percent"`
}

type PID struct {
	PIDProfile               uint8                    `cbor:"pid_profile" json:"pid_profile"`
	PIDRates                 []PIDRates               `cbor:"pid_rates,omitempty" json:"pid_rates"`
	StickProfile             uint8                    `cbor:"stick_profile" json:"stick_profile"`
	StickRates               []StickRates             `cbor:"stick_rates,omitempty" json:"stick_rates"`
	SmallAngle               AnglePIDRates            `cbor:"small_angle,omitempty" json:"small_angle"`
	BigAngle                 AnglePIDRates            `cbor:"big_angle,omitempty" json:"big_angle"`
	ThrottleDTermAttenuation ThrottleDTermAttenuation `cbor:"throttle_dterm_attenuation,omitempty" json:"throttle_dterm_attenuation"`
}

type Motor struct {
	InvertYaw             uint8   `cbor:"invert_yaw" json:"invert_yaw"`
	DigitalIdle           float32 `cbor:"digital_idle" json:"digital_idle"`
	DShotTime             uint16  `cbor:"dshot_time" json:"dshot_time"`
	GyroOrientation       uint8   `cbor:"gyro_orientation" json:"gyro_orientation"`
	TorqueBoost           float32 `cbor:"torque_boost" json:"torque_boost"`
	ThrottleBoost         float32 `cbor:"throttle_boost" json:"throttle_boost"`
	MotorPins             [4]uint `cbor:"motor_pins" json:"motor_pins"`
	TurtleThrottlePercent float32 `cbor:"turtle_throttle_percent" json:"turtle_throttle_percent"`
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

type OSD struct {
	Elements []uint `cbor:"elements" json:"elements"`
}

type Serial struct {
	RX         uint `cbor:"rx" json:"rx"`
	SmartAudio uint `cbor:"smart_audio" json:"smart_audio"`
}

type FilterParameter struct {
	Type       uint8   `cbor:"type" json:"type"`
	CutoffFreq float32 `cbor:"cutoff_freq" json:"cutoff_freq"`
}

type Filter struct {
	Gyro               []FilterParameter `cbor:"gyro,omitempty" json:"gyro"`
	DTerm              []FilterParameter `cbor:"dterm,omitempty" json:"dterm"`
	DTermDynamicEnable uint8             `cbor:"dterm_dynamic_enable" json:"dterm_dynamic_enable"`
	DTermDynamicMin    float32           `cbor:"dterm_dynamic_min" json:"dterm_dynamic_min"`
	DTermDynamicMax    float32           `cbor:"dterm_dynamic_max" json:"dterm_dynamic_max"`
}

type Metadata struct {
	Name     string `cbor:"name" json:"name"`
	Datetime uint32 `cbor:"datetime" json:"datetime"`
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
	TargetName          string   `cbor:"target_name" json:"target_name"`
	GITVersion          string   `cbor:"git_version" json:"git_version"`
	RXProtocol          uint     `cbor:"rx_protocol" json:"rx_protocol"`
	QuicProtocolVersion uint     `cbor:"quic_protocol_version" json:"quic_protocol_version"`
	MotorPins           []string `cbor:"motor_pins" json:"motor_pins"`
	UsartPorts          []string `cbor:"usart_ports" json:"usart_ports"`
}
type BlackboxCompact struct {
	_ struct{} `cbor:",toarray"`

	Loop uint32 `cbor:"loop" json:"loop"`
	Time uint32 `cbor:"time" json:"time"`

	PidPTerm [3]int `cbor:"pid_p_term" json:"pid_p_term"`
	PidITerm [3]int `cbor:"pid_i_term" json:"pid_i_term"`
	PidDTerm [3]int `cbor:"pid_d_term" json:"pid_d_term"`

	Rx       [4]int `cbor:"rx" json:"rx"`
	Setpoint [4]int `cbor:"setpoint" json:"setpoint"`

	AccelRaw    [3]int `cbor:"accel_raw" json:"accel_raw"`
	AccelFilter [3]int `cbor:"accel_filter" json:"accel_filter"`

	GyroRaw    [3]int `cbor:"gyro_raw" json:"gyro_raw"`
	GyroFilter [3]int `cbor:"gyro_filter" json:"gyro_filter"`

	Motor [4]int `cbor:"motor" json:"motor"`
}

type State struct {
	Looptime float32 `cbor:"looptime" json:"looptime"`
	Uptime   float32 `cbor:"uptime" json:"uptime"`
	CPULoad  float32 `cbor:"cpu_load" json:"cpu_load"`

	LipoCellCount float32 `cbor:"lipo_cell_count" json:"lipo_cell_count"`
	Vbattfilt     float32 `cbor:"vbattfilt" json:"vbattfilt"`
	VbattfiltCorr float32 `cbor:"vbattfilt_corr" json:"vbattfilt_corr"`
	VbattComp     float32 `cbor:"vbatt_comp" json:"vbatt_comp"`
	Vreffilt      float32 `cbor:"vreffilt" json:"vreffilt"`

	Rx         Vec4 `cbor:"rx" json:"rx"`
	RxFiltered Vec4 `cbor:"rx_filtered" json:"rx_filtered"`
	RxOverride Vec4 `cbor:"rx_override" json:"rx_override"`

	Throttle float32 `cbor:"throttle" json:"throttle"`
	Thrsum   float32 `cbor:"thrsum" json:"thrsum"`

	Aux []uint `cbor:"aux" json:"aux"`

	AccelRaw Vec3 `cbor:"accel_raw" json:"accel_raw"`
	Accel    Vec3 `cbor:"accel" json:"accel"`

	GyroRaw Vec3 `cbor:"gyro_raw" json:"gyro_raw"`
	Gyro    Vec3 `cbor:"gyro" json:"gyro"`

	GEstG    Vec3 `cbor:"GEstG" json:"GEstG"`
	Attitude Vec3 `cbor:"attitude" json:"attitude"`

	Setpoint  Vec3 `cbor:"setpoint" json:"setpoint"`
	Error     Vec3 `cbor:"error" json:"error"`
	Errorvect Vec3 `cbor:"errorvect" json:"errorvect"`
	Pidoutput Vec3 `cbor:"pidoutput" json:"pidoutput"`
}

type PidRatePreset struct {
	Index uint32   `cbor:"index" json:"index"`
	Name  string   `cbor:"name" json:"name"`
	Rate  PIDRates `cbor:"rate" json:"rate"`
}

type VtxSettings struct {
	Detected   uint `cbor:"detected" json:"detected"`
	Band       uint `cbor:"band" json:"band"`
	Channel    uint `cbor:"channel" json:"channel"`
	PitMode    uint `cbor:"pit_mode" json:"pit_mode"`
	PowerLevel uint `cbor:"power_level" json:"power_level"`
}
