package yolotree

import (
	"berty.tech/yolo/v2/go/pkg/yolopb"
	"fmt"
	"sort"
)

func DisplayTreeFormat(d *yolopb.Batch) {
	sort.Slice(d.Builds, func(i, j int) bool {
		return d.Builds[i].FinishedAt.Before(*d.Builds[j].FinishedAt)
	})
	for _, b := range d.Builds {
		fmt.Printf(" - builds: %s from %s\n", b.ShortID, b.GetHasProjectID())
		for _, a := range d.Artifacts {
			if a.HasBuildID == b.ID {
				fmt.Printf(" - > artifacts: %s\n", a.LocalPath)
			}
		}
		fmt.Println()
	}
}
