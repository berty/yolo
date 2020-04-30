package testutil

import (
	"flag"
	"os"
	"strconv"
	"testing"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var debug = flag.Bool("debug", false, "is more verbose logging")

func Logger(t *testing.T) *zap.Logger {
	t.Helper()

	bertyDebug := parseBoolFromEnv("YOLO_DEBUG") || *debug
	if !bertyDebug {
		return zap.NewNop()
	}

	// setup zap config
	config := zap.NewDevelopmentConfig()
	config.DisableStacktrace = true
	config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	config.Level.SetLevel(zap.DebugLevel)

	// build logger
	logger, err := config.Build()
	if err != nil {
		t.Errorf("setup debug logger error: `%v`", err)
		return zap.NewNop()
	}
	return logger
}

func parseBoolFromEnv(key string) (b bool) {
	b, _ = strconv.ParseBool(os.Getenv(key))
	return
}
