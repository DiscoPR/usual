import {
  GROUP_LIKES,
  OCCASIONS,
  PARTY_KINDS,
  WEATHER_WANTS,
  toggleLike,
  type Intake,
} from "../lib/intake";

export function IntakeForm({
  value,
  onChange,
}: {
  value: Intake;
  onChange: (next: Intake) => void;
}) {
  return (
    <div className="form-stack">
      <p className="hint">
        Get to know the trip. Pick who is going, any theme, what the group
        likes, and the weather they want. Usuals stay the taste anchors.
      </p>
      <fieldset className="choice-set">
        <legend>Who</legend>
        <div className="choice-row">
          {PARTY_KINDS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`btn-win ${value.partyKind === option.id ? "is-down" : ""}`}
              onClick={() => onChange({ ...value, partyKind: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
        {value.partyKind === "named_group" ? (
          <label>
            <span>Group name</span>
            <input
              className="field"
              value={value.partyName}
              onChange={(event) =>
                onChange({ ...value, partyName: event.target.value })
              }
              placeholder="The Tuesday crew"
            />
          </label>
        ) : null}
      </fieldset>
      <fieldset className="choice-set">
        <legend>Occasion / theme</legend>
        <div className="choice-row">
          {OCCASIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`btn-win ${value.occasion === option.id ? "is-down" : ""}`}
              onClick={() => onChange({ ...value, occasion: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="choice-set">
        <legend>What they like (pick more than one)</legend>
        <div className="choice-row">
          {GROUP_LIKES.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`btn-win ${value.groupLikes.includes(option.id) ? "is-down" : ""}`}
              onClick={() =>
                onChange({
                  ...value,
                  groupLikes: toggleLike(value.groupLikes, option.id),
                })
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="choice-set">
        <legend>Weather / setting</legend>
        <div className="choice-row">
          {WEATHER_WANTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`btn-win ${value.weatherWant === option.id ? "is-down" : ""}`}
              onClick={() => onChange({ ...value, weatherWant: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
