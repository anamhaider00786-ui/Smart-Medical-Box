import { useEffect, useMemo, useState } from 'react'
import { demoCompartments, demoDevice, demoLogs, demoMedicines, demoNotifications, demoProfile, demoSchedules } from '../data/demoData'
import { uid } from '../utils/helpers'
import { dataMode } from '../services/dataService'

export function useDemoData() {
  const [medicines, setMedicines] = useState(() => JSON.parse(localStorage.getItem('smb_medicines') || 'null') || demoMedicines)
  const [schedules, setSchedules] = useState(() => JSON.parse(localStorage.getItem('smb_schedules') || 'null') || demoSchedules)
  const [logs, setLogs] = useState(() => JSON.parse(localStorage.getItem('smb_logs') || 'null') || demoLogs)
  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('smb_notifications') || 'null') || demoNotifications)
  const [device, setDevice] = useState(() => JSON.parse(localStorage.getItem('smb_device') || 'null') || demoDevice)
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('smb_profile') || 'null') || demoProfile)
  const [isDemo, setIsDemo] = useState(dataMode === 'demo')

  useEffect(() => localStorage.setItem('smb_medicines', JSON.stringify(medicines)), [medicines])
  useEffect(() => localStorage.setItem('smb_schedules', JSON.stringify(schedules)), [schedules])
  useEffect(() => localStorage.setItem('smb_logs', JSON.stringify(logs)), [logs])
  useEffect(() => localStorage.setItem('smb_notifications', JSON.stringify(notifications)), [notifications])
  useEffect(() => localStorage.setItem('smb_device', JSON.stringify(device)), [device])
  useEffect(() => localStorage.setItem('smb_profile', JSON.stringify(profile)), [profile])

  const resetDemo = () => {
    setMedicines(demoMedicines); setSchedules(demoSchedules); setLogs(demoLogs)
    setNotifications(demoNotifications); setDevice(demoDevice); setProfile(demoProfile)
    setIsDemo(true)
  }

  const addMedicine = (medicine) => setMedicines(prev => [...prev, { ...medicine, id: uid('med') }])
  const editMedicine = (id, medicine) => setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...medicine } : m))
  const removeMedicine = (id) => {
    setMedicines(prev => prev.filter(m => m.id !== id))
    setSchedules(prev => prev.filter(s => s.medicine_id !== id))
  }
  const addSchedule = (schedule) => setSchedules(prev => [...prev, { ...schedule, id: uid('sch') }])
  const editSchedule = (id, schedule) => setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...schedule } : s))
  const removeSchedule = (id) => setSchedules(prev => prev.filter(s => s.id !== id))

  const markTaken = (logId) => {
    const now = new Date().toISOString()
    setLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'Taken', taken_at: now } : log))
    setNotifications(prev => [{ id: uid('notif'), type: 'reminder', title: 'Medicine taken', message: 'A scheduled medicine was marked as taken.', created_at: now, read: false }, ...prev])
  }

  const snooze = (logId) => {
    setNotifications(prev => [{ id: uid('notif'), type: 'reminder', title: 'Reminder snoozed', message: 'The medicine reminder was snoozed for 10 minutes.', created_at: new Date().toISOString(), read: false }, ...prev])
    return logId
  }

  const simulateCompartmentOpen = (number = 3) => {
    const now = new Date().toISOString()
    setDevice(prev => ({ ...prev, last_sync: now, connection: 'Online' }))
    setNotifications(prev => [{ id: uid('notif'), type: 'compartment', title: 'Compartment opened', message: `Compartment ${number} was opened in Demo Mode.`, created_at: now, read: false }, ...prev])
  }

  const simulateTaken = () => {
    const pending = logs.find(l => ['Pending', 'Upcoming'].includes(l.status) && l.scheduled_date === new Date().toISOString().slice(0,10))
    if (pending) markTaken(pending.id)
    return pending
  }

  const markNotificationRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const deleteNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id))

  const compartments = useMemo(() => demoCompartments.map(c => ({
    ...c,
    medicine_id: medicines.find(m => m.compartment === c.number)?.id ?? null,
    medicine: medicines.find(m => m.compartment === c.number)?.name ?? null,
    status: medicines.find(m => m.compartment === c.number)?.active ? 'Ready' : 'Empty',
    next_scheduled_time: schedules.find(s => s.compartment === c.number)?.time ?? null
  })), [medicines, schedules])

  return {
    medicines, schedules, logs, notifications, device, profile, compartments, isDemo,
    setDevice, setProfile, setIsDemo, resetDemo,
    addMedicine, editMedicine, removeMedicine, addSchedule, editSchedule, removeSchedule,
    markTaken, snooze, simulateCompartmentOpen, simulateTaken,
    markNotificationRead, markAllRead, deleteNotification
  }
}
