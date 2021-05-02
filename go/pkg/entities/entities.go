package entities

import "berty.tech/yolo/v2/go/pkg/yolopb"

type BuildListFilters struct {
	Entities []*yolopb.Entity
	Projects []*yolopb.Project
}
