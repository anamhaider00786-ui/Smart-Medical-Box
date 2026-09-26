import { useMemo, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Medicines from './pages/Medicines'
import Schedule from './pages/Schedule'
import Compartments from './pages/Compartments'
import History from './pages/History'
import Notifications from './pages/Notifications'
import Device from './pages/Device'
import Settings from './pages/Settings'
import { useDemoData } from './hooks/useDemoData'
import Toast from './components/Toast'

export default function App() {
  const data = useDemoData()
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('smb_auth') === 'true')
  const [toast, setToast] = useState(null)
  const notify = (message, type='success') => { setToast({message,type}); window.clearTimeout(window.__smbToast); window.__smbToast = window.setTimeout(()=>setToast(null), 3200) }
  const unreadCount = useMemo(()=>data.notifications.filter(n=>!n.read).length,[data.notifications])

  if (!authenticated) return <><Login onLogin={()=>{sessionStorage.setItem('smb_auth','true');setAuthenticated(true)}} notify={notify}/><Toast toast={toast} onClose={()=>setToast(null)}/></>

  return <AppLayout profile={data.profile} device={data.device} unreadCount={unreadCount}>
    <Routes>
      <Route path="/" element={<Dashboard data={data} notify={notify}/>}/>
      <Route path="/medicines" element={<Medicines data={data} notify={notify}/>}/>
      <Route path="/schedule" element={<Schedule data={data} notify={notify}/>}/>
      <Route path="/compartments" element={<Compartments data={data} notify={notify}/>}/>
      <Route path="/history" element={<History data={data}/>}/>
      <Route path="/notifications" element={<Notifications data={data} notify={notify}/>}/>
      <Route path="/device" element={<Device data={data} notify={notify}/>}/>
      <Route path="/settings" element={<Settings data={data} notify={notify}/>}/>
    </Routes>
    <Toast toast={toast} onClose={()=>setToast(null)}/>
  </AppLayout>
}
