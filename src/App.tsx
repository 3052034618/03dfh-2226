import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WaybillList from '@/pages/WaybillList'
import TemperatureDetail from '@/pages/TemperatureDetail'
import Handover from '@/pages/Handover'
import HandoverView from '@/pages/HandoverView'
import HandoverVerify from '@/pages/HandoverVerify'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WaybillList />} />
        <Route path="/verify" element={<HandoverVerify />} />
        <Route path="/waybill/:waybillId" element={<TemperatureDetail />} />
        <Route path="/handover/:waybillId" element={<Handover />} />
        <Route path="/receive/:handoverCode" element={<HandoverView />} />
      </Routes>
    </Router>
  )
}
