import { useState } from 'react'
import { Activity, ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { supabaseConfigured, supabase } from '../services/supabase'

export default function Login({ onLogin, notify }) {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [remember,setRemember]=useState(true)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')

  const demo = () => onLogin('demo')
  const submit = async e => {
    e.preventDefault(); setError('')
    if (!email || !password) return setError('Enter your email and password.')
    if (!supabaseConfigured) return setError('Supabase is not configured. Use Demo Mode for the college demonstration.')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({email,password})
    setLoading(false)
    if (error) setError(error.message)
    else { if(remember) localStorage.setItem('smb_remember','true'); onLogin() }
  }

  return <div className="login-page">
    <div className="login-visual">
      <div className="login-brand"><div className="brand-mark large"><Activity size={27}/></div><span>Smart Medical Box</span></div>
      <div className="visual-copy"><span className="eyebrow">IoT medication assistance</span><h1>Medication reminders, organized in one place.</h1><p>A student-built dashboard connecting a smart medicine box, embedded sensing and a secure web experience.</p>
        <div className="feature-list"><div><CheckCircle2/> <span>Schedule and track medicines</span></div><div><ShieldCheck/> <span>Device monitoring ready</span></div><div><Activity/> <span>Works offline in Demo Mode</span></div></div>
      </div>
      <div className="visual-note">Student prototype • Healthcare assistance only</div>
    </div>
    <div className="login-panel">
      <div className="login-card">
        <div className="mobile-brand"><div className="brand-mark"><Activity size={22}/></div><strong>Smart Medical Box</strong></div>
        <span className="eyebrow">Welcome back</span><h2>Sign in to dashboard</h2><p className="muted">Use your Supabase account or start the college-ready demo.</p>
        <form onSubmit={submit}>
          <label>Email<div className="input-icon"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
          <label>Password<div className="input-icon"><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div></label>
          <div className="login-options"><label className="checkbox-label"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Remember me</label><button type="button" className="link-button" onClick={async ()=>{ if(!email) return setError('Enter your email first.'); if(!supabaseConfigured) return notify('Supabase is not configured. Password recovery is available after Supabase setup.','info'); setError(''); const { error } = await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`}); if(error) setError(error.message); else notify('Password reset email sent. Check your inbox.','info') }}>Forgot password?</button></div>
          {error && <div className="inline-error">{error}</div>}
          <button className="button button-primary button-wide" disabled={loading}>{loading?'Signing in…':'Login'} <ArrowRight size={17}/></button>
        </form>
        <div className="or-divider"><span>or</span></div>
        <button className="button button-demo button-wide" onClick={demo}>Enter Demo Mode <Activity size={17}/></button>
        <div className="login-footnote"><span className="dot online"/> {supabaseConfigured?'Supabase configured':'Demo-ready'} • No API keys are hardcoded</div>
      </div>
    </div>
  </div>
}
