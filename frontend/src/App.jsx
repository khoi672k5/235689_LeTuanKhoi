import { useEffect, useState } from 'react';
import { getDevices, getDevice, createDevice, updateDevice, deleteDevice } from './api';
import './App.css';

const STATUSES = ['Đang sử dụng', 'Hư hỏng', 'Đang sửa chữa', 'Ngừng sử dụng'];
const STATUS_CLASS = {
  'Đang sử dụng': 'ok',
  'Hư hỏng': 'bad',
  'Đang sửa chữa': 'fix',
  'Ngừng sử dụng': 'off',
};
const EMPTY = {
  deviceId: '', name: '', deviceType: '', room: '', brand: '',
  model: '', quantity: 1, status: STATUSES[0], purchaseDate: '', description: '',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status] || 'off'}`}>{status}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DeviceForm({ device, onSaved, onCancel, notify }) {
  const editing = Boolean(device);
  const [form, setForm] = useState(
    editing ? { ...EMPTY, ...device, purchaseDate: toInput(device.purchaseDate) } : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    const payload = {
      deviceId: form.deviceId, name: form.name, deviceType: form.deviceType,
      room: form.room, brand: form.brand, model: form.model,
      quantity: Number(form.quantity), status: form.status,
      purchaseDate: form.purchaseDate || null, description: form.description,
    };
    try {
      if (editing) await updateDevice(device._id, payload);
      else await createDevice(payload);
      notify('success', editing ? 'Đã cập nhật thiết bị' : 'Đã thêm thiết bị mới');
      onSaved();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="form">
      {err && <div className="alert error full">{err}</div>}
      <label>Mã thiết bị *<input value={form.deviceId} onChange={set('deviceId')} required /></label>
      <label>Tên thiết bị *<input value={form.name} onChange={set('name')} required /></label>
      <label>Loại thiết bị *<input value={form.deviceType} onChange={set('deviceType')} required /></label>
      <label>Phòng học *<input value={form.room} onChange={set('room')} required /></label>
      <label>Hãng sản xuất<input value={form.brand} onChange={set('brand')} /></label>
      <label>Model<input value={form.model} onChange={set('model')} /></label>
      <label>Số lượng *<input type="number" min="0" value={form.quantity} onChange={set('quantity')} required /></label>
      <label>Tình trạng
        <select value={form.status} onChange={set('status')}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label>Ngày mua / tiếp nhận<input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} /></label>
      <label className="full">Mô tả, ghi chú<textarea rows="3" value={form.description} onChange={set('description')} /></label>
      <div className="actions full">
        <button type="button" className="btn" onClick={onCancel}>Hủy</button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
}

function DetailView({ id, fallback }) {
  const [device, setDevice] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    getDevice(id)
      .then(setDevice)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const rows = [
    ['Mã thiết bị', device.deviceId], ['Tên thiết bị', device.name],
    ['Loại thiết bị', device.deviceType], ['Phòng học', device.room],
    ['Hãng sản xuất', device.brand || '—'], ['Model', device.model || '—'],
    ['Số lượng', device.quantity], ['Ngày mua / tiếp nhận', fmtDate(device.purchaseDate)],
    ['Mô tả', device.description || '—'],
  ];
  return (
    <div>
      {loading && <p className="muted">Đang tải chi tiết...</p>}
      {err && <div className="alert error">{err}</div>}
      <dl className="detail">
        {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        <div><dt>Tình trạng</dt><dd><StatusBadge status={device.status} /></dd></div>
      </dl>
    </div>
  );
}

export default function App() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const t = setTimeout(async () => {
      try {
        const data = await getDevices(search.trim());
        if (!cancelled) setDevices(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, reloadKey]);

  const notify = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };
  const reload = () => setReloadKey((k) => k + 1);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteDevice(modal.device._id);
      notify('success', 'Đã xóa thiết bị');
      setModal(null);
      reload();
    } catch (e) {
      notify('error', e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Quản lý thiết bị phòng học</h1>
        <p className="muted">235689 - Lê Tuấn Khôi</p>
      </header>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Tìm theo mã, tên, loại thiết bị hoặc phòng học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn primary" onClick={() => setModal({ type: 'form', device: null })}>
          + Thêm thiết bị
        </button>
      </div>

      {toast && <div className={`alert ${toast.type}`}>{toast.text}</div>}
      {error && (
        <div className="alert error">
          {error} <button className="link" onClick={reload}>Thử lại</button>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th><th>Tên thiết bị</th><th>Loại</th><th>Phòng</th>
              <th>Số lượng</th><th>Tình trạng</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" className="center muted">Đang tải dữ liệu...</td></tr>
            )}
            {!loading && !error && devices.length === 0 && (
              <tr><td colSpan="7" className="center muted">Không có thiết bị nào.</td></tr>
            )}
            {!loading && devices.map((d) => (
              <tr key={d._id}>
                <td>{d.deviceId}</td>
                <td>{d.name}</td>
                <td>{d.deviceType}</td>
                <td>{d.room}</td>
                <td>{d.quantity}</td>
                <td><StatusBadge status={d.status} /></td>
                <td className="row-actions">
                  <button className="btn sm" onClick={() => setModal({ type: 'view', device: d })}>Xem</button>
                  <button className="btn sm" onClick={() => setModal({ type: 'form', device: d })}>Sửa</button>
                  <button className="btn sm danger" onClick={() => setModal({ type: 'delete', device: d })}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.type === 'view' && (
        <Modal title="Chi tiết thiết bị" onClose={() => setModal(null)}>
          <DetailView id={modal.device._id} fallback={modal.device} />
        </Modal>
      )}
      {modal?.type === 'form' && (
        <Modal title={modal.device ? 'Cập nhật thiết bị' : 'Thêm thiết bị'} onClose={() => setModal(null)}>
          <DeviceForm
            device={modal.device}
            notify={notify}
            onCancel={() => setModal(null)}
            onSaved={() => { setModal(null); reload(); }}
          />
        </Modal>
      )}
      {modal?.type === 'delete' && (
        <Modal title="Xác nhận xóa" onClose={() => setModal(null)}>
          <p>Bạn có chắc muốn xóa thiết bị <b>{modal.device.name}</b> ({modal.device.deviceId})?</p>
          <div className="actions">
            <button className="btn" onClick={() => setModal(null)}>Hủy</button>
            <button className="btn danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}