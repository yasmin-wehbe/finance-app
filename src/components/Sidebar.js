import { NavLink } from "react-router-dom";
import {
    BanknotesIcon,
    ChartBarIcon,
    AdjustmentsVerticalIcon,
    PencilSquareIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

function Sidebar(){

    // Helper function for link styling
    const linkClass = (isActive) => 
    `flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
      isActive 
        ? 'bg-blue-100 font-medium text-blue-900' 
        : 'text-gray-600 hover:bg-blue-50'
    }`;


    return(
        <div className="fixed top-0 left-0 w-56 h-screen bg-white border-r border-gray-200 p-2">
        <h2 className="text-xl text-blue-900 font-semibold mb-4 px-2">Finances</h2>
        {/*Navigation links*/}
            <nav className="flex flex-col">

                <NavLink to="/wealth" className={({ isActive }) => linkClass(isActive)}>
                    <BanknotesIcon className="w-5 h-5" />Wealth</NavLink>

                <NavLink to="/emergency" className={({ isActive }) => linkClass(isActive)}>
                    <ExclamationTriangleIcon className="w-5 h-5" />Emergency</NavLink>
                
                <NavLink to="/forecast" className={({ isActive }) => linkClass(isActive)}>
                    <ChartBarIcon className="w-5 h-5" />Forecast</NavLink>
                
                <NavLink to="/scenarios" className={({ isActive }) => linkClass(isActive)}>
                    <AdjustmentsVerticalIcon className="w-5 h-5" />Scenarios</NavLink>
                
                <NavLink to="/notes" className={({ isActive }) => linkClass(isActive)}>
                    <PencilSquareIcon className="w-5 h-5" />Notes</NavLink>
                
            </nav>
        </div>
    )
}

export default Sidebar;