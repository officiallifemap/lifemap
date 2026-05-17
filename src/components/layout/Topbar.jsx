import useStore from '../../store/useStore'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  finances:  'Finances',
  events:    'Life Events',
  goals:     'Goals',
  calendar:  'Calendar',
  todos:     'To-Dos',
  habits:    'Habits',
  people:    'People',
  wellness:  'Wellness',
  notes:     'Notes',
}

export default function Topbar() {
  const currentPage = useStore((s) => s.currentPage)
  const setModal = useStore((s) => s.setModal)

  const today = new Date()
  const dateStr = `${DAYS[today.getDay()]}, ${MONTHS[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`

  return (
    <div className="topbar">
      <div>
        <div className="page-title">{PAGE_TITLES[currentPage]}</div>
        <div className="page-date">{dateStr}</div>
      </div>
      <button className="quick-add-btn" onClick={() => setModal('quick-add')}>
        + Quick Add
      </button>
    </div>
  )
}
