package main

import (
	"context"
	"flag"
	"fmt"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"berty.tech/yolo/v2/go/pkg/yolosvc"
	"moul.io/godev"

	"github.com/peterbourgon/ff/v2"
	"github.com/peterbourgon/ff/v2/ffcli"
)

func storeFlagSet() *flag.FlagSet {
	fs := flag.NewFlagSet("store", flag.ExitOnError)

	fs.StringVar(&dbStorePath, "db-path", ":memory:", "DB Store path")
	fs.BoolVar(&withPreloading, "with-preloading", false, "with auto DB preloading")

	return fs
}

func dumpObjectsCommand() *ffcli.Command {
	return &ffcli.Command{
		Name:    `dump-objects`,
		FlagSet: storeFlagSet(),
		Options: []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			logger, err := loggerFromArgs(verbose, logFormat)
			if err != nil {
				return err
			}
			db, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer db.Close()

			svc, err := yolosvc.NewService(db, yolosvc.ServiceOpts{
				Logger:  logger,
				DevMode: true,
			})
			if err != nil {
				return err
			}

			ctx := context.Background()
			input := &yolopb.DevDumpObjects_Request{
				WithPreloading: true,
			}
			ret, err := svc.DevDumpObjects(ctx, input)
			if err != nil {
				return err
			}
			fmt.Println(godev.PrettyJSONPB(ret))

			return nil
		},
	}
}

func treeCommand() *ffcli.Command {
	return &ffcli.Command{
		Name:    `tree`,
		FlagSet: storeFlagSet(),
		Options: []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(ctx context.Context, _ []string) error {
			logger, err := loggerFromArgs(verbose, logFormat)
			if err != nil {
				return err
			}
			db, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer db.Close()

			svc, err := yolosvc.NewService(db, yolosvc.ServiceOpts{
				Logger:  logger,
				DevMode: true,
			})
			if err != nil {
				return err
			}

			input := &yolopb.DevDumpObjects_Request{
				WithPreloading: true,
			}
			ret, err := svc.DevDumpObjects(ctx, input)
			if err != nil {
				return err
			}
			fmt.Println(ret.Batch.DisplayTreeFormat())

			return nil
		},
	}
}

func infoCommand() *ffcli.Command {
	return &ffcli.Command{
		Name:    `info`,
		FlagSet: storeFlagSet(),
		Options: []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			logger, err := loggerFromArgs(verbose, logFormat)
			if err != nil {
				return err
			}
			db, err := dbFromArgs(dbStorePath, logger)
			if err != nil {
				return err
			}
			defer db.Close()

			svc, err := yolosvc.NewService(db, yolosvc.ServiceOpts{
				Logger:  logger,
				DevMode: true,
			})
			if err != nil {
				return err
			}

			ctx := context.Background()
			ret, err := svc.Status(ctx, nil)
			if err != nil {
				return err
			}
			fmt.Println(godev.PrettyJSONPB(ret))

			return nil
		},
	}
}
