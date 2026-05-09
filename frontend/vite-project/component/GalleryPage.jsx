import { useState, useEffect, useRef, useCallback } from "react";

// ─── API base — change to your Express URL in production ──────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// ─── Sticker picker options ───────────────────────────────────────────────
const STICKERS = ["🌸", "✨", "🎀", "💕", "🐰", "💜", "🌟", "💎", "🌷", "⭐", "🩷", "🐻", "💙", "🌈", "🦋"];

const THEMES = {
  sakura:  { bg: "linear-gradient(135deg,#fff0f6 0%,#fce4f5 50%,#f0e6ff 100%)", accent: "#e879a8", sub: "#c778a8", text: "#7c1f6e", pillT: "#6b0f5a", glow: "rgba(232,121,168,0.22)", pill: "linear-gradient(135deg,#ffb6d9,#e0aaff)", card: "rgba(255,255,255,0.82)" },
  dreamy:  { bg: "linear-gradient(135deg,#f0e6ff 0%,#e6f0ff 50%,#e0f4ff 100%)", accent: "#9b59f7", sub: "#8a6ec7", text: "#3b1a7a", pillT: "#2e1260", glow: "rgba(155,89,247,0.2)",  pill: "linear-gradient(135deg,#c3abf5,#a8d8f0)", card: "rgba(255,255,255,0.84)" },
  golden:  { bg: "linear-gradient(135deg,#fff8e6 0%,#ffecd6 50%,#fff0f5 100%)", accent: "#e8a020", sub: "#c08030", text: "#6b3a00", pillT: "#5a2e00", glow: "rgba(232,160,32,0.18)", pill: "linear-gradient(135deg,#ffd6a5,#ffb6d9)", card: "rgba(255,255,255,0.86)" },
  mint:    { bg: "linear-gradient(135deg,#e6fff4 0%,#e0f4ff 50%,#f0ffe6 100%)", accent: "#20c997", sub: "#30a07a", text: "#0a4a35", pillT: "#053a28", glow: "rgba(32,201,151,0.18)", pill: "linear-gradient(135deg,#b5ead7,#a8d8f0)", card: "rgba(255,255,255,0.86)" },
};

// ─── tiny hook: fetch all photos from backend ─────────────────────────────
function usePhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/photos`);
      const data = await res.json();
      if (data.success) setPhotos(data.photos);
      else throw new Error(data.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  return { photos, setPhotos, loading, error, refetch: fetchPhotos };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD MODAL
// ─────────────────────────────────────────────────────────────────────────────
function UploadModal({ theme, onClose, onUploaded }) {
  const [files,    setFiles]    = useState([]);    // { file, preview, title, caption, tag, sticker }
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const dropRef = useRef(null);

  const addFiles = (incoming) => {
    const next = Array.from(incoming).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      title:   file.name.replace(/\.[^.]+$/, ""),
      caption: "",
      tag:     "cute",
      sticker: STICKERS[Math.floor(Math.random() * STICKERS.length)],
    }));
    setFiles((prev) => [...prev, ...next]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const updateFile = (i, field, value) =>
    setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));

  const removeFile = (i) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);

    const fd = new FormData();
    files.forEach((f)  => fd.append("files", f.file));
    files.forEach((f)  => fd.append("titles",   f.title));
    files.forEach((f)  => fd.append("captions", f.caption));
    files.forEach((f)  => fd.append("tags",     f.tag));
    files.forEach((f)  => fd.append("stickers", f.sticker));

    // XHR so we can track progress
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      setUploading(false);
      if (data.success) {
        onUploaded(data.photos);
        onClose();
      } else {
        alert("Upload failed: " + data.message);
      }
    };
    xhr.onerror = () => { setUploading(false); alert("Network error"); };
    xhr.open("POST", `${API}/photos/upload`);
    xhr.send(fd);
  };

  const t = theme;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(10,0,25,0.75)", backdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "rgba(255,255,255,0.96)", borderRadius: 28,
        width: "100%", maxWidth: 680, maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: `0 30px 80px ${t.glow}, 0 8px 30px rgba(0,0,0,0.2)`,
        border: "1.5px solid rgba(255,255,255,0.9)",
        animation: "popIn .3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Dancing Script',cursive", fontSize: 28, background: `linear-gradient(135deg,${t.accent},${t.sub})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              add memories ✨
            </div>
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginTop: 1 }}>drop your photos & add cute details</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 16, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input").click()}
            style={{
              border: `2px dashed ${t.accent}55`,
              borderRadius: 20, padding: "28px 20px",
              textAlign: "center", cursor: "pointer", marginBottom: 20,
              background: `${t.accent}06`,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = `${t.accent}12`}
            onMouseLeave={(e) => e.currentTarget.style.background = `${t.accent}06`}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🌸</div>
            <div style={{ fontWeight: 800, color: t.text, fontSize: 14 }}>drop photos here or click to browse</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>JPG · PNG · WebP · GIF · max 10MB each</div>
            <input id="file-input" type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
          </div>

          {/* File cards */}
          {files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: "flex", gap: 14, background: "rgba(255,255,255,0.9)",
                  border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 18,
                  padding: "14px", alignItems: "flex-start",
                }}>
                  {/* Preview */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={f.preview} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 14, display: "block" }} />
                    <button onClick={() => removeFile(i)} style={{
                      position: "absolute", top: -6, right: -6,
                      background: "#ff6b8a", border: "none", borderRadius: "50%",
                      width: 22, height: 22, color: "#fff", fontSize: 11,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                  </div>

                  {/* Fields */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      value={f.title}
                      onChange={(e) => updateFile(i, "title", e.target.value)}
                      placeholder="title (e.g. golden hour ✨)"
                      style={inputStyle(t)}
                    />
                    <input
                      value={f.caption}
                      onChange={(e) => updateFile(i, "caption", e.target.value)}
                      placeholder="caption or vibe..."
                      style={inputStyle(t)}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={f.tag}
                        onChange={(e) => updateFile(i, "tag", e.target.value)}
                        placeholder="tag"
                        style={{ ...inputStyle(t), flex: 1 }}
                      />
                      {/* Sticker picker */}
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 2 }}>
                        {STICKERS.map((s) => (
                          <button key={s} onClick={() => updateFile(i, "sticker", s)} style={{
                            fontSize: 16, border: f.sticker === s ? `2px solid ${t.accent}` : "2px solid transparent",
                            borderRadius: 8, padding: "2px 4px", cursor: "pointer",
                            background: f.sticker === s ? `${t.accent}18` : "transparent",
                            transform: f.sticker === s ? "scale(1.2)" : "scale(1)",
                            transition: "all 0.15s ease",
                          }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {uploading && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>
                <span>uploading to Cloudinary...</span><span>{progress}%</span>
              </div>
              <div style={{ height: 6, background: "#f0e6ff", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,${t.accent},${t.sub})`, borderRadius: 10, transition: "width 0.3s ease" }} />
              </div>
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={!files.length || uploading}
            style={{
              width: "100%", padding: "14px", borderRadius: 16, border: "none",
              background: files.length && !uploading ? `linear-gradient(135deg,${t.accent},${t.sub})` : "#ddd",
              color: files.length && !uploading ? "#fff" : "#aaa",
              fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15,
              cursor: files.length && !uploading ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              transform: files.length && !uploading ? "scale(1)" : "scale(0.98)",
            }}
          >
            {uploading ? "uploading... 🌸" : files.length ? `upload ${files.length} photo${files.length > 1 ? "s" : ""} 💕` : "pick some photos first ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}

function inputStyle(t) {
  return {
    width: "100%", padding: "9px 14px", borderRadius: 12,
    border: "1.5px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.9)", fontSize: 13,
    fontFamily: "'Nunito',sans-serif", fontWeight: 600,
    outline: "none", color: t.text,
    transition: "border-color 0.2s",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL — edit a single photo's metadata
// ─────────────────────────────────────────────────────────────────────────────
function EditModal({ photo, theme, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:   photo.title   || "",
    caption: photo.caption || "",
    tag:     photo.tag     || "cute",
    sticker: photo.sticker || "🌸",
  });
  const [saving, setSaving] = useState(false);
  const t = theme;

  const save = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/photos/${photo._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.photo); onClose(); }
      else alert("Save failed: " + data.message);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(10,0,25,0.7)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460, boxShadow: `0 24px 60px ${t.glow}`, border: "1.5px solid rgba(255,255,255,0.9)", animation: "popIn .28s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 16, padding: 20, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <img src={photo.thumbnailUrl || photo.url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 14, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "'Dancing Script',cursive", fontSize: 24, background: `linear-gradient(135deg,${t.accent},${t.sub})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>edit details</div>
            <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginTop: 2 }}>update title, caption & vibe</div>
          </div>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="title" style={inputStyle(t)} />
          <input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="caption" style={inputStyle(t)} />
          <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="tag" style={inputStyle(t)} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>sticker</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {STICKERS.map((s) => (
                <button key={s} onClick={() => setForm({ ...form, sticker: s })} style={{ fontSize: 18, border: form.sticker === s ? `2px solid ${t.accent}` : "2px solid transparent", borderRadius: 8, padding: "3px 5px", cursor: "pointer", background: form.sticker === s ? `${t.accent}18` : "transparent", transform: form.sticker === s ? "scale(1.2)" : "scale(1)", transition: "all 0.15s" }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.08)", background: "transparent", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700, color: "#888" }}>cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${t.accent},${t.sub})`, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14 }}>{saving ? "saving..." : "save changes 💕"}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, theme, onClose, onNav, onEdit, onDelete }) {
  const t = theme;
  const photo = photos[index];

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowLeft")  onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, onNav]);

  if (!photo) return null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8888, background: "rgba(10,0,25,0.9)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", borderRadius: 28, overflow: "hidden", boxShadow: `0 30px 80px ${t.glow},0 8px 28px rgba(0,0,0,.4)`, border: "2px solid rgba(255,255,255,.15)", animation: "popIn .28s cubic-bezier(0.34,1.56,0.64,1)", maxWidth: "85vw", maxHeight: "85vh" }}>
        <img src={photo.url} alt={photo.title} style={{ display: "block", maxWidth: "85vw", maxHeight: "78vh", objectFit: "contain" }} />

        {/* Bottom bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,rgba(10,0,25,.85) 0%,transparent 100%)", padding: "32px 18px 14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "'Nunito',sans-serif" }}>{photo.sticker} {photo.title}</div>
            {photo.caption && <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, marginTop: 2, fontFamily: "'Nunito',sans-serif" }}>{photo.caption}</div>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => onEdit(photo)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>✏️ edit</button>
            <button onClick={() => onDelete(photo)} style={{ background: "rgba(255,80,100,0.3)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>🗑 delete</button>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, fontFamily: "'Nunito',sans-serif" }}>{index + 1}/{photos.length}</span>
          </div>
        </div>

        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        <button onClick={() => onNav(-1)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <button onClick={() => onNav(1)}  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO CARD
// ─────────────────────────────────────────────────────────────────────────────
function PhotoCard({ photo, index, theme, onClick }) {
  const [hovered, setHovered] = useState(false);
  const t = theme;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(index)}
      style={{
        position: "relative", borderRadius: 20, overflow: "hidden",
        cursor: "pointer", border: "1.5px solid rgba(255,255,255,0.75)",
        boxShadow: hovered ? `0 16px 36px ${t.glow}` : `0 4px 16px ${t.glow}`,
        transform: hovered ? "translateY(-6px) scale(1.025) rotate(-0.4deg)" : "translateY(0) scale(1) rotate(0deg)",
        transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        animation: `fadeUp 0.5s ease ${index * 0.055}s both`,
        background: t.card,
      }}
    >
      <img
        src={photo.thumbnailUrl || photo.url}
        alt={photo.title}
        loading="lazy"
        style={{ width: "100%", height: 200, objectFit: "cover", objectPosition: "center top", display: "block", transition: "transform 0.4s ease", transform: hovered ? "scale(1.07)" : "scale(1)" }}
      />

      {/* Color tint */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,rgba(255,255,255,0.06) 0%,transparent 50%,rgba(0,0,0,0.1) 100%)", pointerEvents: "none" }} />

      {/* Tag */}
      <div style={{ position: "absolute", top: 10, right: 10, background: t.pill, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800, color: t.pillT, fontFamily: "'Nunito',sans-serif", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
        {photo.tag}
      </div>

      {/* Favorite star */}
      {photo.isFavorite && (
        <div style={{ position: "absolute", top: 10, left: 10, fontSize: 16 }}>⭐</div>
      )}

      {/* Hover overlay */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,rgba(10,0,25,0.7) 0%,transparent 100%)", padding: "28px 12px 10px", opacity: hovered ? 1 : 0, transition: "opacity 0.25s ease" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 12, fontFamily: "'Nunito',sans-serif" }}>{photo.sticker} {photo.title}</div>
        {photo.caption && <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2, fontFamily: "'Nunito',sans-serif" }}>{photo.caption}</div>}
      </div>

      {/* Sticker pop on hover */}
      <div style={{ position: "absolute", left: 10, bottom: hovered ? 8 : -26, fontSize: 20, transition: "bottom 0.35s cubic-bezier(0.34,1.56,0.64,1)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.15))" }}>
        {photo.sticker}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function GalleryPage() {
  const { photos, setPhotos, loading, error, refetch } = usePhotos();

  const [themeName, setThemeName] = useState("sakura");
  const [lbIndex,   setLbIndex]   = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [editPhoto,  setEditPhoto]  = useState(null);
  const [search,     setSearch]     = useState("");

  const theme = THEMES[themeName];

  const filtered = photos.filter((p) =>
    !search || [p.title, p.caption, p.tag].some((s) => s?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUploaded = (newPhotos) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
  };

  const handleSaved = (updated) => {
    setPhotos((prev) => prev.map((p) => p._id === updated._id ? updated : p));
  };

  const handleDelete = async (photo) => {
    if (!window.confirm(`Delete "${photo.title}"? This can't be undone 🥺`)) return;
    try {
      const res  = await fetch(`${API}/photos/${photo._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPhotos((prev) => prev.filter((p) => p._id !== photo._id));
        setLbIndex(null);
      } else alert("Delete failed: " + data.message);
    } catch (e) { alert(e.message); }
  };

  const toggleFavorite = async (e, photo) => {
    e.stopPropagation();
    const res  = await fetch(`${API}/photos/${photo._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFavorite: !photo.isFavorite }) });
    const data = await res.json();
    if (data.success) handleSaved(data.photo);
  };

  const t = theme;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Nunito:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-family: 'Nunito', sans-serif; }
        body { background: ${t.bg}; transition: background 0.6s ease; min-height: 100vh; }

        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes popIn   { from { transform:scale(0.72); opacity:0; } to { transform:scale(1); opacity:1; } }
        @keyframes float   { 0%,100% { transform:translateY(0) rotate(-3deg); } 50% { transform:translateY(-10px) rotate(3deg); } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        @keyframes spin    { to { transform:rotate(360deg); } }

        input:focus { outline: none; border-color: ${t.accent} !important; box-shadow: 0 0 0 3px ${t.accent}22; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${t.glow}; border-radius: 10px; }
      `}</style>

      {/* Floating particles */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        {["✨","🌸","💕","⭐","🎀","💫","🌟","🩷","🌷","💜"].map((e, i) => (
          <div key={i} style={{ position: "absolute", left: `${(i * 9.5 + 4) % 92}%`, top: `${(i * 11 + 3) % 88}%`, fontSize: `${13 + (i % 4) * 4}px`, opacity: 0.14 + (i % 5) * 0.03, animation: `float ${3.5 + (i % 4)}s ease-in-out ${i * 0.38}s infinite` }}>{e}</div>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "24px 20px 40px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14, animation: "fadeUp 0.5s ease both" }}>
          <div>
           <h1
  style={{
    fontFamily: "'Dancing Script', cursive",
    fontSize: 44,
    color: t.accent,
    lineHeight: 1.1,
  }}
>
  her little world ♡
</h1>
            <div style={{ fontSize: 12, color: t.sub, fontWeight: 700, marginTop: 2, letterSpacing: "0.08em" }}>
              {photos.length} memories · click to open · ✨ hover to peek
            </div>
          </div>

          {/* Upload button */}
          <button onClick={() => setShowUpload(true)} style={{ background: `linear-gradient(135deg,${t.accent},${t.sub})`, border: "none", borderRadius: 18, padding: "13px 24px", color: "#fff", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: `0 6px 20px ${t.glow}`, transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px) scale(1.04)"; e.currentTarget.style.boxShadow = `0 10px 28px ${t.glow}`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 6px 20px ${t.glow}`; }}
          >
            + add photos 🌸
          </button>
        </div>

        {/* ── Controls row ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center", animation: "fadeUp 0.5s ease 0.05s both" }}>
          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍  search by title, caption, tag..."
            style={{ flex: 1, minWidth: 200, padding: "10px 16px", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.82)", fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: 13, color: t.text, backdropFilter: "blur(8px)" }}
          />

          {/* Theme pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries({ sakura: "🌸", dreamy: "💜", golden: "✨", mint: "🌿" }).map(([k, emoji]) => (
              <button key={k} onClick={() => setThemeName(k)} style={{ padding: "8px 14px", borderRadius: 14, border: themeName === k ? `2px solid ${t.accent}` : "1.5px solid rgba(0,0,0,0.08)", background: themeName === k ? t.pill : "rgba(255,255,255,0.7)", color: themeName === k ? t.pillT : "#777", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 12, cursor: "pointer", transition: "all 0.2s ease", backdropFilter: "blur(8px)", transform: themeName === k ? "scale(1.06)" : "scale(1)" }}>{emoji} {k}</button>
            ))}
          </div>
        </div>

        {/* ── States ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 36, animation: "spin 1.5s linear infinite", display: "inline-block" }}>🌸</div>
            <div style={{ marginTop: 12, color: t.sub, fontWeight: 700, fontSize: 14 }}>loading your memories...</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 36 }}>🥺</div>
            <div style={{ marginTop: 10, color: "#e879a8", fontWeight: 700 }}>{error}</div>
            <button onClick={refetch} style={{ marginTop: 14, padding: "10px 22px", borderRadius: 14, border: "none", background: t.pill, color: t.pillT, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>try again</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <div style={{ marginTop: 12, color: t.sub, fontWeight: 700, fontSize: 16 }}>{search ? "no photos match that search 🔍" : "no photos yet — add some! 🌸"}</div>
            {!search && <button onClick={() => setShowUpload(true)} style={{ marginTop: 18, padding: "12px 28px", borderRadius: 16, border: "none", background: `linear-gradient(135deg,${t.accent},${t.sub})`, color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontSize: 14 }}>+ upload first photo 💕</button>}
          </div>
        )}

        {/* ── Photo grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ columns: "repeat(auto-fill, minmax(220px, 1fr))", columnGap: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {filtered.map((photo, i) => (
              <PhotoCard key={photo._id} photo={photo} index={i} theme={t} onClick={(idx) => setLbIndex(idx)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showUpload && <UploadModal theme={t} onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}

      {editPhoto && <EditModal photo={editPhoto} theme={t} onClose={() => setEditPhoto(null)} onSaved={handleSaved} />}

      {lbIndex !== null && (
        <Lightbox
          photos={filtered}
          index={lbIndex}
          theme={t}
          onClose={() => setLbIndex(null)}
          onNav={(dir) => setLbIndex((lbIndex + dir + filtered.length) % filtered.length)}
          onEdit={(photo) => { setLbIndex(null); setEditPhoto(photo); }}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}