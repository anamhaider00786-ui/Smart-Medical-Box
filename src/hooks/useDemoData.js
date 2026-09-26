import { useEffect, useMemo, useState } from 'react'
import { demoCompartments, demoDevice, demoLogs, demoMedicines, demoNotifications, demoProfile, demoSchedules } from '../data/demoData'
import { getWeekdayShort, localDateKey, uid } from '../utils/helpers'

const STORAGE_VERSION = '2'

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function sameDemoSession() {
  return localStorage.getItem('smb_demo_date') === localDateKey() && localStorage.getItem('smb_demo_version') === STORAGE_VERSION
}

function initialState(key, fallback) {
  return sameDemoSession() ? readStored(key, fallback) : fallback
}

export function useDemoData(forceDemo = false) {
  const [medicines, setMedicines] = useState(() => initialState('smb_medicines', demoMedicines))
  const [schedules, setSchedules] = useState(() => initialState('smb_schedules', demoSchedules))
  const [logs, setLogs] = useState(() => initialState('smb_logs', demoLogs))
  const [notifications, setNotifications] = useState(() => initialState('smb_notifications', demoNotifications))
  const [device, setDevice] = useState(() => initialState('smb_device', demoDevice))
  const [profile, setProfile] = useState(() => initialState('smb_profile', demoProfile))
  // The current UI state layer is local/demo even when Supabase Auth is configured.
  // This prevents the interface from falsely presenting local state as live database data.
  const [isDemo, setIsDemo] = useState(true)

  useEffect(() => {
    localStorage.setItem('smb_demo_date', localDateKey())
    localStorage.setItem('smb_demo_version', STORAGE_VERSION)
  }, [])
  useEffect(() => localStorage.setItem('smb_medicines', JSON.stringify(medicines)), [medicines])
  useEffect(() => localStorage.setItem('smb_schedules', JSON.stringify(schedules)), [schedules])
  useEffect(() => localStorage.setItem('smb_logs', JSON.stringify(logs)), [logs])
  useEffect(() => localStorage.setItem('smb_notifications', JSON.stringify(notifications)), [notifications])
  useEffect(() => localStorage.setItem('smb_device', JSON.stringify(device)), [device])
  useEffect(() => localStorage.setItem('smb_profile', JSON.stringify(profile)), [profile])
  useEffect(() => setIsDemo(true), [forceDemo])

  const resetDemo = () => {
    setMedicines([...demoMedicines]); setSchedules([...demoSchedules]); setLogs([...demoLogs])
    setNotifications([...demoNotifications]); setDevice({ ...demoDevice, last_sync: new Date().toISOString() }); setProfile({ ...demoProfile })
    localStorage.setItem('smb_demo_date', localDateKey())
    setIsDemo(true)
  }

  const addMedicine = (medicine) => setMedicines(prev => [...prev, { ...medicine, id: uid('med') }])
  const editMedicine = (id, medicine) => setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...medicine } : m))
  const removeMedicine = (id) => {
    setMedicines(prev => prev.filter(m => m.id !== id))
    setSchedules(prev => prev.filter(s => s.medicine_id !== id))
    setLogs(prev => prev.filter(l => l.medicine_id !== id))
  }

  const createTodayLogForSchedule = (schedule) => ({
    id: uid('log'), medicine_id: schedule.medicine_id, compartment: Number(schedule.compartment),
    scheduled_date: localDateKey(), scheduled_time: schedule.time, taken_at: null,
    status: schedule.time < new Date().toTimeString().slice(0,5) ? 'Pending' : 'Upcoming'
  })

  const addSchedule = (schedule) => {
    const normalized = { ...schedule, id: uid('sch'), compartment: Number(schedule.compartment) }
    setSchedules(prev => [...prev, normalized])
    if (normalized.days.includes(getWeekdayShort()) && normalized.active !== false) {
      setLogs(prev => [...prev, createTodayLogForSchedule(normalized)])
    }
  }

  const editSchedule = (id, schedule) => {
    const normalized = { ...schedule, compartment: Number(schedule.compartment) }
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...normalized } : s))
    setLogs(prev => prev.map(log => log.id.startsWith('log-') && log.scheduled_date === localDateKey() && log.medicine_id === normalized.medicine_id ? { ...log, scheduled_time: normalized.time, compartment: normalized.compartment } : log))
  }

  const removeSchedule = (id) => {
    const target = schedules.find(s => s.id === id)
    setSchedules(prev => prev.filter(s => s.id !== id))
    if (target) setLogs(prev => prev.filter(l => !(l.scheduled_date === localDateKey() && l.medicine_id === target.medicine_id && l.scheduled_time === target.time)))
  }

  const markTaken = (logId) => {
    const now = new Date().toISOString()
    setLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'Taken', taken_at: now } : log))
    setNotifications(prev => [{ id: uid('notif'), type: 'reminder', title: 'Medicine taken', message: 'A scheduled medicine was marked as taken.', created_at: now, read: false }, ...prev])
  }

  const triggerReminder = (medicineName = 'Medicine') => {
    const now = new Date().toISOString()
    setNotifications(prev => [{ id: uid('notif'), type: 'reminder', title: 'Medicine reminder', message: `${medicineName} reminder was triggered in Demo Mode.`, created_at: now, read: false }, ...prev])
  }

  const snooze = (logId) => {
    const now = new Date().toISOString()
    setNotifications(prev => [{ id: uid('notif'), type: 'reminder', title: 'Reminder snoozed', message: 'The medicine reminder was snoozed for 10 minutes.', created_at: now, read: false }, ...prev])
    setLogs(prev => prev.map(log => log.id === logId ? { ...log, snoozed_until: new Date(Date.now() + 10 * 60 * 1000).toISOString() } : log))
  }

  const simulateCompartmentOpen = (number = 3) => {
    const now = new Date().toISOString()
    setDevice(prev => ({ ...prev, last_sync: now, connection: 'Online' }))
    setNotifications(prev => [{ id: uid('notif'), type: 'compartment', title: 'Compartment opened', message: `Compartment ${number} was opened in Demo Mode.`, created_at: now, read: false }, ...prev])
  }

  const simulateTaken = () => {
    const pending = logs.find(l => ['Pending', 'Upcoming'].includes(l.status) && l.scheduled_date === localDateKey())
    if (pending) markTaken(pending.id)
    return pending
  }

  const simulateTelemetry = () => {
    setDevice(prev => ({
      ...prev,
      last_sync: new Date().toISOString(),
      connection: 'Online',
      wifi: 'Connected',
      battery: Math.max(20, Math.min(100, prev.battery + (Math.random() > 0.5 ? 1 : -1))),
      temperature: Number((prev.temperature + (Math.random() - 0.5) * 0.6).toFixed(1)),
      humidity: Math.max(30, Math.min(75, Math.round(prev.humidity + (Math.random() - 0.5) * 2)))
    }))
  }

  const markNotificationRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const deleteNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id))

  const compartments = useMemo(() => demoCompartments.map(c => {
    const medicine = medicines.find(m => m.compartment === c.number)
    return {
      ...c,
      medicine_id: medicine?.id ?? null,
      medicine: medicine?.name ?? null,
      status: medicine?.active ? 'Ready' : 'Empty',
      next_scheduled_time: schedules.find(s => s.compartment === c.number && s.active !== false)?.time ?? null
    }
  }), [medicines, schedules])

  return {
    medicines, schedules, logs, notifications, device, profile, compartments, isDemo,
    setDevice, setProfile, setIsDemo, resetDemo,
    addMedicine, editMedicine, removeMedicine, addSchedule, editSchedule, removeSchedule,
    markTaken, snooze, triggerReminder, simulateCompartmentOpen, simulateTaken, simulateTelemetry,
    markNotificationRead, markAllRead, deleteNotification
  }
}
