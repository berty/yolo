package server

import (
	"fmt"
	"html/template"
	"io"
	"path"
	"strings"

	"github.com/Masterminds/sprig"
	"github.com/gobuffalo/packd"
	"github.com/labstack/echo"
	"go.uber.org/zap"
)

type ctxFuncmap struct {
	fm template.FuncMap
	c  echo.Context
}

func (s *Server) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	if s.Debug {
		if err := s.loadTemplates(); err != nil {
			return err
		}
	}
	tmpl, ok := s.templates[name]
	if !ok {
		return fmt.Errorf("no such template %q", name)
	}

	s.templatesMutex.Lock()
	defer s.templatesMutex.Unlock()
	s.funcmap.c = c

	return tmpl.Execute(w, data)
}

func (s *Server) getFuncmap() *ctxFuncmap {
	f := &ctxFuncmap{}
	f.fm = sprig.FuncMap()
	f.fm["yolo"] = func() string { return "yolo" } // custom func example
	f.fm["jobToPlatform"] = func(job string) string {
		switch job {
		case IOS_STAFF_JOB, IOS_YOLO_JOB:
			return "ios"
		case ANDROID_STAFF_JOB, ANDROID_YOLO_JOB:
			return "android"
		}
		return "other"
	}
	f.fm["jobToKind"] = func(job string) string {
		switch job {
		case IOS_STAFF_JOB, ANDROID_STAFF_JOB:
			return "staff"
		case IOS_YOLO_JOB, ANDROID_YOLO_JOB:
			return "yolo"
		}
		return "other"
	}
	f.fm["safeHTML"] = func(s string) template.HTML {
		return template.HTML(s)
	}
	f.fm["safeAttr"] = func(s string) template.HTMLAttr {
		return template.HTMLAttr(s)
	}
	f.fm["safeURL"] = func(s string) template.URL {
		return template.URL(s)
	}
	f.fm["jobToPlatformIcon"] = func(job string) string {
		switch f.fm["jobToPlatform"].(func(string) string)(job) {
		case "ios":
			return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 305"  xml:space="preserve"><path d="M40.738,112.119c-25.785,44.745-9.393,112.648,19.121,153.82C74.092,286.523,88.502,305,108.239,305 c0.372,0,0.745-0.007,1.127-0.022c9.273-0.37,15.974-3.225,22.453-5.984c7.274-3.1,14.797-6.305,26.597-6.305c11.226,0,18.39,3.101,25.318,6.099c6.828,2.954,13.861,6.01,24.253,5.815c22.232-0.414,35.882-20.352,47.925-37.941c12.567-18.365,18.871-36.196,20.998-43.01l0.086-0.271c0.405-1.211-0.167-2.533-1.328-3.066c-0.032-0.015-0.15-0.064-0.183-0.078c-3.915-1.601-38.257-16.836-38.618-58.36c-0.335-33.736,25.763-51.601,30.997-54.839l0.244-0.152c0.567-0.365,0.962-0.944,1.096-1.606c0.134-0.661-0.006-1.349-0.386-1.905c-18.014-26.362-45.624-30.335-56.74-30.813c-1.613-0.161-3.278-0.242-4.95-0.242c-13.056,0-25.563,4.931-35.611,8.893c-6.936,2.735-12.927,5.097-17.059,5.097c-4.643,0-10.668-2.391-17.645-5.159c-9.33-3.703-19.905-7.899-31.1-7.899c-0.267,0-0.53,0.003-0.789,0.008C78.894,73.643,54.298,88.535,40.738,112.119z"/><path d="M212.101,0.002c-15.763,0.642-34.672,10.345-45.974,23.583c-9.605,11.127-18.988,29.679-16.516,48.379c0.155,1.17,1.107,2.073,2.284,2.164c1.064,0.083,2.15,0.125,3.232,0.126c15.413,0,32.04-8.527,43.395-22.257c11.951-14.498,17.994-33.104,16.166-49.77C214.544,0.921,213.395-0.049,212.101,0.002z"/></svg>`
		case "android":
			return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 553 553"><g><path d="M76.774,179.141c-9.529,0-17.614,3.323-24.26,9.969c-6.646,6.646-9.97,14.621-9.97,23.929v142.914c0,9.541,3.323,17.619,9.97,24.266c6.646,6.646,14.731,9.97,24.26,9.97c9.522,0,17.558-3.323,24.101-9.97c6.53-6.646,9.804-14.725,9.804-24.266V213.039c0-9.309-3.323-17.283-9.97-23.929C94.062,182.464,86.082,179.141,76.774,179.141z"/><path d="M351.972,50.847L375.57,7.315c1.549-2.882,0.998-5.092-1.658-6.646c-2.883-1.34-5.098-0.661-6.646,1.989l-23.928,43.88c-21.055-9.309-43.324-13.972-66.807-13.972c-23.488,0-45.759,4.664-66.806,13.972l-23.929-43.88c-1.555-2.65-3.77-3.323-6.646-1.989c-2.662,1.561-3.213,3.764-1.658,6.646l23.599,43.532c-23.929,12.203-42.987,29.198-57.167,51.022c-14.18,21.836-21.273,45.698-21.273,71.628h307.426c0-25.924-7.094-49.787-21.273-71.628C394.623,80.045,375.675,63.05,351.972,50.847z M215.539,114.165c-2.552,2.558-5.6,3.831-9.143,3.831c-3.55,0-6.536-1.273-8.972-3.831c-2.436-2.546-3.654-5.582-3.654-9.137c0-3.543,1.218-6.585,3.654-9.137c2.436-2.546,5.429-3.819,8.972-3.819s6.591,1.273,9.143,3.819c2.546,2.558,3.825,5.594,3.825,9.137C219.357,108.577,218.079,111.619,215.539,114.165z M355.625,114.165c-2.441,2.558-5.434,3.831-8.971,3.831c-3.551,0-6.598-1.273-9.145-3.831c-2.551-2.546-3.824-5.582-3.824-9.137c0-3.543,1.273-6.585,3.824-9.137c2.547-2.546,5.594-3.819,9.145-3.819c3.543,0,6.529,1.273,8.971,3.819c2.438,2.558,3.654,5.594,3.654,9.137C359.279,108.577,358.062,111.619,355.625,114.165z"/><path d="M123.971,406.804c0,10.202,3.543,18.838,10.63,25.925c7.093,7.087,15.729,10.63,25.924,10.63h24.596l0.337,75.454c0,9.528,3.323,17.619,9.969,24.266s14.627,9.97,23.929,9.97c9.523,0,17.613-3.323,24.26-9.97s9.97-14.737,9.97-24.266v-75.447h45.864v75.447c0,9.528,3.322,17.619,9.969,24.266s14.73,9.97,24.26,9.97c9.523,0,17.613-3.323,24.26-9.97s9.969-14.737,9.969-24.266v-75.447h24.928c9.969,0,18.494-3.544,25.594-10.631c7.086-7.087,10.631-15.723,10.631-25.924V185.45H123.971V406.804z"/><path d="M476.275,179.141c-9.309,0-17.283,3.274-23.93,9.804c-6.646,6.542-9.969,14.578-9.969,24.094v142.914c0,9.541,3.322,17.619,9.969,24.266s14.627,9.97,23.93,9.97c9.523,0,17.613-3.323,24.26-9.97s9.969-14.725,9.969-24.266V213.039c0-9.517-3.322-17.552-9.969-24.094C493.888,182.415,485.798,179.141,476.275,179.141z"/></g></svg>`
		}
		return "NO_SUCH_ICON_INVALID_PLATFORM"
	}

	return f
}

func (s *Server) loadTemplates() error {
	s.templates = make(map[string]*template.Template)

	// load template files
	layoutContent := ""
	pageContents := map[string]string{}
	err := s.TemplatesBox.Walk(func(filepath string, file packd.File) error {
		if strings.HasPrefix(path.Base(filepath), ".#") {
			// ignore temporary files
			return nil
		}
		switch path.Dir(filepath) {
		case ".":
			pageContents[filepath] = file.String()
		case "layout":
			layoutContent += file.String()
		}
		return nil
	})
	if err != nil {
		return err
	}

	// generate optimized templates
	s.funcmap = s.getFuncmap()
	mainTemplate := template.New("main").Funcs(s.funcmap.fm)
	mainTemplate = template.Must(mainTemplate.Parse(`{{define "main"}}{{template "base" .}}{{end}}`))
	mainTemplate = template.Must(mainTemplate.Parse(layoutContent))
	for filepath, content := range pageContents {
		s.templates[filepath] = template.Must(mainTemplate.Clone())
		s.templates[filepath] = template.Must(s.templates[filepath].Parse(content))
	}
	zap.L().Debug("templates loaded")
	return nil
}