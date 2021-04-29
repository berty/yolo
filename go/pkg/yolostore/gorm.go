package yolostore

import "github.com/jinzhu/gorm"

type Store interface {
}

type store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) Store {
	return &store{
		db: db,
	}
}
