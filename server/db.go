package server

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	_ "github.com/mattn/go-sqlite3"
)

type LogEntry struct {
	gorm.Model
	buildNumber int64
	branchName  string
	user        string
	path        string
	isStaff     bool
}

func (s *Server) loadDB(sqlConn string) error {
	var err error
	s.db, err = gorm.Open("sqlite3", sqlConn)
	if err != nil {
		return err
	}

	if err := s.db.AutoMigrate(
		&LogEntry{},
	).Error; err != nil {
		return err
	}

	return err
}

// func (s *Server) AddLogEntry(attrs) {}

// func (s  *Server) LogEntryCount(filter) {}
