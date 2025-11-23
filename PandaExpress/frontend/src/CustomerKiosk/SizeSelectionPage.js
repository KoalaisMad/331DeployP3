import React from 'react';
import './Customer.css';

export default function SizeSelectionPage({
    sizeName,
    price,
    requiredSides = 0,
    requiredEntrees = 0,
    availableSides = [],
    availableEntrees = [],
    selectedSides = [],
    selectedEntrees = [],
    setSelectedSides,
    setSelectedEntrees,
    toggleSelect,
    onConfirm,
    onCancel
}){
    const [phase, setPhase] = React.useState('sides'); // 'sides' | 'entrees'

    const sidesSelectedCount = selectedSides.length;
    const entreesSelectedCount = selectedEntrees.length;

    function goNext(){
        setPhase('entrees');
    }

    function goBack(){
        setPhase('sides');
    }

    return (
        <div className="size-page" role="main" aria-label={`${sizeName} selection`}>
            <div className="size-page-inner">
                <header className="size-page-header">
                    <h2>{sizeName} — choose your items</h2>
                    <div className="size-page-price">Price: {typeof price === 'number' ? `$${price.toFixed(2)}` : '—'}</div>
                </header>

                {phase === 'sides' ? (
                    <div className="size-column-full">
                        <h3>Sides — select {requiredSides}</h3>
                        {availableSides.length === 0 ? (
                            <div className="loading">Loading sides…</div>
                        ) : (
                            <div className="size-grid">
                                {availableSides.map(s => {
                                    const disabled = !selectedSides.includes(s.name) && selectedSides.length >= (requiredSides || 0);
                                    const selected = selectedSides.includes(s.name);
                                    return (
                                        <button
                                            key={s.name}
                                            type="button"
                                            className={`size-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                                            onClick={() => !disabled && toggleSelect(selectedSides, setSelectedSides, s.name)}
                                            aria-pressed={selected}
                                            aria-disabled={disabled}
                                        >
                                            {s.imgUrl ? <img src={s.imgUrl} alt={s.name} className="size-card-image" onError={(e)=>{e.currentTarget.style.display='none';}} /> : <div className="size-card-no-image">No image</div>}
                                            <div className="size-card-caption">
                                                <div className="size-item-name">{s.name}</div>
                                                <div className="size-item-action">{selected ? 'Selected' : `Choose (${selectedSides.includes(s.name) ? '✓' : ''})`}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="size-actions">
                            <button className="btn" onClick={goNext} disabled={sidesSelectedCount !== (requiredSides || 0)}>Next: Entrees</button>
                            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="size-column-full">
                        <h3>Entrees — select {requiredEntrees}</h3>
                        {availableEntrees.length === 0 ? (
                            <div className="loading">Loading entrees…</div>
                        ) : (
                            <div className="size-grid">
                                {availableEntrees.map(e => {
                                    const disabled = !selectedEntrees.includes(e.name) && selectedEntrees.length >= (requiredEntrees || 0);
                                    const selected = selectedEntrees.includes(e.name);
                                    return (
                                        <button
                                            key={e.name}
                                            type="button"
                                            className={`size-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                                            onClick={() => !disabled && toggleSelect(selectedEntrees, setSelectedEntrees, e.name)}
                                            aria-pressed={selected}
                                            aria-disabled={disabled}
                                        >
                                            {e.imgUrl ? <img src={e.imgUrl} alt={e.name} className="size-card-image" onError={(e)=>{e.currentTarget.style.display='none';}} /> : <div className="size-card-no-image">No image</div>}
                                            <div className="size-card-caption">
                                                <div className="size-item-name">{e.name}</div>
                                                <div className="size-item-action">{selected ? 'Selected' : `Choose (${selectedEntrees.includes(e.name) ? '✓' : ''})`}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="size-actions">
                            <button className="btn btn-secondary" onClick={goBack}>Back</button>
                            <button className="btn" onClick={onConfirm} disabled={entreesSelectedCount !== (requiredEntrees || 0)}>Add to order</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
