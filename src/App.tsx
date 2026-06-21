import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WaybillList from '@/pages/WaybillList'
import TemperatureDetail from '@/pages/TemperatureDetail'
import Handover from '@/pages/Handover'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WaybillList />} />
        <Route path="/waybill/:id" element={<TemperatureDetail />} />
        <Route path="/handover/:waybillId" element={<Handover />} />
      </Routes>
    </Router>
  )
}
