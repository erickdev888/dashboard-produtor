# Trilha original sintetizada para o comercial (sem direitos autorais de terceiros).
# 120 BPM, Lá menor (Am - F - C - G), com riser, drop e efeitos sincronizados aos cortes.
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
DUR = 47.2
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
BEAT = 0.5

def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i >= N: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414
    R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414

def env(n, a=0.005, d=0.2, curve=4):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / d)
    return e

def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos')
    return sosfilt(sos, x)

def note(m): return 440 * 2 ** ((m - 69) / 12)

def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7)
    click = filt(rng.standard_normal(n), 'highpass', 3000) * np.exp(-t * 300) * 0.25
    return np.tanh((s + click) * 1.6)

def clap():
    n = int(0.3 * SR); t = np.arange(n) / SR
    nz = filt(rng.standard_normal(n), 'bandpass', [900, 3200])
    e = np.zeros(n)
    for off in (0, 0.011, 0.022):
        e += (t >= off) * np.exp(-np.maximum(0, t - off) * (90 if off < 0.02 else 18))
    return nz * e * 0.5

def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR); t = np.arange(n) / SR
    nz = filt(rng.standard_normal(n), 'highpass', 7500)
    return nz * np.exp(-t * (14 if open_ else 70)) * 0.35

def saw(f, n, detune=(0, 0.12, -0.12)):
    t = np.arange(n) / SR; out = np.zeros(n)
    for dt in detune:
        ff = f * 2 ** (dt / 12)
        out += 2 * ((t * ff + rng.random()) % 1) - 1
    return out / len(detune)

def pad(chord, dur):
    n = int(dur * SR); s = np.zeros(n)
    for m in chord: s += saw(note(m), n, (0, 0.08, -0.08, 0.15))
    s = filt(s, 'lowpass', 1400)
    a = int(0.35 * SR); e = np.ones(n); e[:a] = np.linspace(0, 1, a); e[-a:] = np.linspace(1, 0, a)
    return s * e * 0.10

def bass(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    f = note(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.tanh(3 * np.sin(2 * np.pi * f * t))
    e = np.minimum(1, t / 0.01) * np.exp(-t * 2.2)
    return s * e * 0.45

def pluck(m, dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    s = saw(note(m), n, (0, 0.05))
    s = filt(s, 'lowpass', 2600) * np.exp(-t * 9)
    return s * 0.16

def bell(m):
    n = int(1.2 * SR); t = np.arange(n) / SR; f = note(m)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
    return s * np.exp(-t * 3.5) * 0.22

def whoosh(dur=0.55, up=True):
    n = int(dur * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n); out = np.zeros(n); seg = 512
    for i in range(0, n, seg):
        k = i / n; fc = 300 + (6000 if up else 6000) * (k if up else 1 - k)
        out[i:i + seg] = filt(nz[i:i + seg], 'bandpass', [max(80, fc * 0.6), min(20000, fc * 1.4)], 1)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return out * e * 0.5

def impact():
    n = int(1.6 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 10)) * t) * np.exp(-t * 2.6)
    crash = filt(rng.standard_normal(n), 'highpass', 2500) * np.exp(-t * 2.2) * 0.35
    return np.tanh((boom + crash) * 1.3)

def riser(dur=2.0):
    n = int(dur * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n); out = np.zeros(n); seg = 1024
    for i in range(0, n, seg):
        k = i / n; fc = 400 + 9000 * k ** 2
        out[i:i + seg] = filt(nz[i:i + seg], 'bandpass', [fc * 0.7, min(22000, fc * 1.3)], 1)
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * (t / dur) ** 2) / SR) * 0.15
    return (out * 0.45 + tone) * (t / dur) ** 1.6

def tick():
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 60) * 0.3 + filt(rng.standard_normal(n), 'highpass', 5000) * np.exp(-t * 120) * 0.2

# ---- arranjo v2: escuro e minimalista ----
import json
W=json.load(open('words.json'))
CHORDS=[(57,60,64),(53,57,60),(50,53,57),(52,56,59)]  # Am F Dm E
ROOTS=[33,29,26,28]
def pop_snd():
    n=int(.09*SR); t=np.arange(n)/SR
    f=900*np.exp(-t*30)+300
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*45)*0.35
def sub(m,dur):
    n=int(dur*SR); t=np.arange(n)/SR; f=note(m)
    return np.tanh(2.2*np.sin(2*np.pi*f*t))*np.minimum(1,t/.008)*np.exp(-t*1.4)*0.5
# gancho: drone grave + pop em cada palavra
place(pad((45,52,57),3.9),0,0.55)
place(riser(3.6),0.1,0.55)
for w in W:
    if w['t']<3.7 or 5.7<=w['t']<7.7: place(pop_snd(),w['t'],0.9,0)
place(impact(),3.7,1.0)
t=3.7; bar=0
while t<46.7:
    c=bar%4; quiet = 39.7<=t<43.3
    place(pad(CHORDS[c],2.05),t,0.55 if not quiet else 0.9)
    for b in range(4):
        bt=t+b*BEAT
        if bt>=46.7: break
        if not quiet:
            place(kick(),bt,1.0)
            if b in (1,3): place(clap(),bt,0.6)
            for h in range(4):
                place(hat(open_=(h==2)),bt+h*BEAT/4,0.28 if h%2 else 0.42,0.3)
            place(sub(ROOTS[c]+(0 if b<2 else 7),0.5),bt,0.85)
        elif b==0: place(sub(ROOTS[c],1.8),bt,0.6)
    t+=2.0; bar+=1
for tt in (5.7,7.7,11.7,15.7,19.1,23.1,26.1,29.1,32.1,36.1,39.7,43.3):
    place(whoosh(0.45),tt-0.38,0.55)
for i in range(12): place(tick(),7.8+i*.17,0.55,(-.4,0,.4)[i%3])
for i in range(5): place(bell((76,79,81,84,88)[i]),32.6+i*.62,0.7)
for i in range(3): place(bell((88,91,93)[i]),37.7+i*.15,0.5)
place(riser(1.2),42.1,0.6)
place(impact(),43.3,0.95); place(impact(),46.3,0.45)
place(pad((45,52,57,60),1.4),45.8,0.7)

mix=np.stack([L,R],1)
mix=filt(mix.T,'highpass',28).T
fade=int(0.7*SR); mix[-fade:]*=np.linspace(1,0,fade)[:,None]
peak=np.max(np.abs(mix)); mix=np.tanh(mix/peak*1.5)/np.tanh(1.5)*0.89
wavfile.write('trilha2.wav',SR,(mix*32767).astype(np.int16))
print('ok')
