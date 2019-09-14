package controller

type Vector [3]float32

type SilverwareRates struct {
	MaxRate   Vector `cbor:"max_rate"`
	AngleExpo Vector `cbor:"angle_expo"`
	AcroExpo  Vector `cbor:"acro_expo"`
}

type BetaflightRates struct {
	RcRate    Vector `cbor:"rc_rate"`
	SuperRate Vector `cbor:"super_rate"`
	Expo      Vector `cbor:"expo"`
}

type Rates struct {
	Mode              uint8           `cbor:"mode"`
	Silverware        SilverwareRates `cbor:"silverware"`
	Betaflight        BetaflightRates `cbor:"betaflight"`
	LevelMaxAngle     float32         `cbor:"level_max_angle"`
	LowRateMulitplier float32         `cbor:"low_rate_mulitplier"`
	SticksDeadband    float32         `cbor:"sticks_deadband"`
}

type PIDRates struct {
	KP Vector `cbor:"kp"`
	KI Vector `cbor:"ki"`
	KD Vector `cbor:"kd"`
}

type StickRates struct {
	Accelerator Vector `cbor:"accelerator"`
	Transition  Vector `cbor:"transition"`
}

type PID struct {
	PIDProfile   uint8        `cbor:"pid_profile"`
	PIDRates     []PIDRates   `cbor:"pid_rates"`
	StickProfile uint8        `cbor:"stick_profile"`
	StickRates   []StickRates `cbor:"stick_rates"`
}

type Motor struct {
	InvertYaw   uint8   `cbor:"invert_yaw"`
	DigitalIdle float32 `cbor:"digital_idle"`
}

type Voltage struct {
	LipoCellCount            uint8   `cbor:"lipo_cell_count"`
	PidVoltageCompensation   uint8   `cbor:"pid_voltage_compensation"`
	VBattLow                 float32 `cbor:"vbattlow"`
	ActualBatteryVoltage     float32 `cbor:"actual_battery_voltage"`
	ReportedTelemetryVoltage float32 `cbor:"reported_telemetry_voltage"`
}

type Channel struct {
	Aux []uint `cbor:"aux"`
}

type Metadata struct {
	Name     string `cbor:"name"`
	Datetime uint32 `cbor:"datetime"`
}

type Profile struct {
	Meta    Metadata `cbor:"meta"`
	Channel Channel  `cbor:"channel"`
	Motor   Motor    `cbor:"motor"`
	Voltage Voltage  `cbor:"voltage"`
	Rate    Rates    `cbor:"rate"`
	PID     PID      `cbor:"pid"`
}
