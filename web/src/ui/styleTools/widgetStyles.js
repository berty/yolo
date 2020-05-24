export const getWidgetStyles = (theme) => ({
  widgetBg: {
    backgroundColor: theme.bg.filter,
  },

  selectedWidgetAccent: {
    color: theme.icon.filterSelected,
  },

  unselectedWidgetAccent: {
    color: theme.icon.filterUnselected,
  },

  widgetSelected: {
    color: theme.text.filterSelectedTitle,
    borderColor: theme.icon.filterSelected,
    backgroundColor: theme.bg.filter,
  },

  widgetUnselected: {
    color: theme.text.filterUnselectedTitle,
    borderColor: theme.border.filter,
  },
})
