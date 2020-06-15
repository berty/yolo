package yolopb

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildPrepareOutput(t *testing.T) {
	tests := []struct {
		msg      string
		expected string
	}{
		{"hello world!", "hello world!"},
		{"Signed-off-by: blah", ""},
		{"hello world!\nSigned-off-by: blah", "hello world!"},
		{"hello world!\nSigned-off-by: blah\nSigned-off-by: blih\nyo\nSigned-off-by: bluh", "hello world!\n\n\nyo"},
	}

	for _, tt := range tests {
		t.Run(tt.msg, func(t *testing.T) {
			build := Build{
				HasMergerequest: &MergeRequest{
					Message: tt.msg,
				},
			}
			err := build.PrepareOutput("")
			require.NoError(t, err)
			assert.Equal(t, tt.expected, build.HasMergerequest.Message)
		})
	}
}
