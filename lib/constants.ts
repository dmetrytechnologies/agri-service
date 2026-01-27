export const CROP_OPTIONS = [
    { label: '🌾 Paddy', value: 'Paddy' },
    { label: '🍞 Wheat', value: 'Wheat' },
    { label: '🥭 Mango', value: 'Mango' },
    { label: '🌶️ Chilli', value: 'Chilli' },
    { label: '☁️ Cotton', value: 'Cotton' },
    { label: '🌽 Maize', value: 'Maize' },
    { label: '🍬 Sugarcane', value: 'Sugarcane' },
    { label: '🍌 Banana', value: 'Banana' }
];

export const getCropLabel = (value: string) => {
    const crop = CROP_OPTIONS.find(c => c.value === value);
    return crop ? crop.label : value;
};
