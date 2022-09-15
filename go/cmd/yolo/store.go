package main

import (
	"context"
	"fmt"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"berty.tech/yolo/v2/go/pkg/yolosvc"
	"moul.io/climan"
	"moul.io/godev"

	"github.com/peterbourgon/ff/v3"
)

func dumpObjectsCommand(commonFlagsBuilder flagsBuilder) *climan.Command {
	return &climan.Command{
		Name:           `dump-objects`,
		FlagSetBuilder: commonFlagsBuilder,
		FFOptions:      []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			logger, err := loggerFromArgs(optsGlobal.verbose, optsGlobal.logFormat)
			if err != nil {
				return err
			}
			db, err := dbFromArgs(optsGlobal.dbStorePath, logger)
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

func treeCommand(commonFlagsBuilder flagsBuilder) *climan.Command {
	return &climan.Command{
		Name:           `tree`,
		FlagSetBuilder: commonFlagsBuilder,
		FFOptions:      []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(ctx context.Context, _ []string) error {
			logger, err := loggerFromArgs(optsGlobal.verbose, optsGlobal.logFormat)
			if err != nil {
				return err
			}
			db, err := dbFromArgs(optsGlobal.dbStorePath, logger)
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

func infoCommand(commonFlagsBuilder flagsBuilder) *climan.Command {
	return &climan.Command{
		Name:           `info`,
		FlagSetBuilder: commonFlagsBuilder,
		FFOptions:      []ff.Option{ff.WithEnvVarNoPrefix()},
		Exec: func(_ context.Context, _ []string) error {
			logger, err := loggerFromArgs(optsGlobal.verbose, optsGlobal.logFormat)
			if err != nil {
				return err
			}
			db, err := dbFromArgs(optsGlobal.dbStorePath, logger)
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
