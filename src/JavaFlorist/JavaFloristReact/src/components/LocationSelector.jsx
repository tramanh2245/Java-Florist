import React, { useState, useEffect } from 'react';
import { State, City } from 'country-state-city';

// Component for selecting State and City
// Uses 'country-state-city' library to get real-world data
export default function LocationSelector({ onLocationSelect }) {
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    
    const [selectedStateCode, setSelectedStateCode] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const COUNTRY_CODE = 'IN'; // Hardcoded to India for this project

    // Load states for India when component mounts
    useEffect(() => {
        const countryStates = State.getStatesOfCountry(COUNTRY_CODE);
        setStates(countryStates);
    }, []);

    // Handle State Selection
    const handleStateChange = (e) => {
        const stateCode = e.target.value;
        setSelectedStateCode(stateCode);
        
        // Fetch cities belonging to the selected state
        const stateData = states.find(s => s.isoCode === stateCode);
        setCities(City.getCitiesOfState(COUNTRY_CODE, stateCode));
        
        // Reset city selection
        setSelectedCity('');

        // Notify parent component about the change
        onLocationSelect({
            state: stateData?.name || '',
            stateCode: stateCode,
            city: ''
        });
    };

    // Handle City Selection
    const handleCityChange = (e) => {
        const cityName = e.target.value;
        setSelectedCity(cityName);
        const stateData = states.find(s => s.isoCode === selectedStateCode);

        // Notify parent component with full location data
        onLocationSelect({
            state: stateData?.name || '',
            stateCode: selectedStateCode,
            city: cityName
        });
    };

    return (
        <div className="form-grid" style={{ marginBottom: 0 }}>
            {/* State Dropdown */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                    className="form-input"
                    value={selectedStateCode}
                    onChange={handleStateChange}
                    required
                >
                    <option value="">-- Select State --</option>
                    {states.map((state) => (
                        <option key={state.isoCode} value={state.isoCode}>
                            {state.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* City Dropdown (Disabled until a state is selected) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select
                    className="form-input"
                    value={selectedCity}
                    onChange={handleCityChange}
                    disabled={!selectedStateCode}
                    required
                >
                    <option value="">-- Select City --</option>
                    {cities.map((city) => (
                        <option key={city.name} value={city.name}>
                            {city.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}