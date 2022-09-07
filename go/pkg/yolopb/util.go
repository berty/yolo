package yolopb

import (
	"regexp"
	"strings"
)

var signedOffByLine = regexp.MustCompile(`Signed-off-by: (.*)`)

func cleanupCommitMessage(msg string) string {
	if msg == "" {
		return ""
	}
	msg = signedOffByLine.ReplaceAllString(msg, "")
	msg = strings.TrimRight(msg, "\n")
	return msg
}
