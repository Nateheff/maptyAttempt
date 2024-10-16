'use strict';

const api_key = fetch('config.json')
  .then(data => data.json())
  .then(data => data['API_KEY']);
console.log(api_key);
//Normal Workout
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Edit Workout
const editFrom = document.querySelector('.editform');
const editType = document.querySelector('.editform__input--type');
const editDistance = document.querySelector('.editform__input--distance');
const editDuration = document.querySelector('.editform__input--duration');
const editCadence = document.querySelector('.editform__input--cadence');
const editElevation = document.querySelector('.editform__input--elevation');
// const editWorkout = document.querySelector('.editform__btn');

//Delete form
const popup = document.querySelector('.popup');
const yes = document.querySelector('.yes');
const no = document.querySelector('.no');
const maybe = document.querySelector('.maybe');

//Have an outloud conversation with your family or whoever about how and why this works.
//We have the CLASS and the constructor and then we create app which is an object (instance) of this class which has the methods and variables within the class and the child classes have all of the methods and variables within the parent class.

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  number = 0;
  // prettier-ignore
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  constructor(coords, distance, duration) {
    this.date = new Date();
    this.id = (Date.now() + '').slice(-10);
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      this.months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  _monthl() {
    this.curMonth = this.months[this.date.getMonth()];
    return this.curMonth;
  }

  _datel() {
    this.curDate = this.date.getDate();
    return this.curDate;
  }

  click() {
    this.clicks++;
  }

  number() {
    this.number++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, coords, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
    this._datel();
    this._monthl();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, coords, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
    this._datel();
    this._monthl();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

/////////////////////////////////////////////////////////////Application Architecture
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #workout2 = [];
  #markers = [];
  #view = [];
  constructor() {
    this._getPosition();

    //Get data from local storage
    this._getLocalStorage();

    inputType.addEventListener('change', this._toggleElevationField);

    editType.addEventListener('change', this._editWType);

    document.body.addEventListener('click', this._handleClicks.bind(this));

    document.body.addEventListener('submit', this._handleSubmits.bind(this));

    // containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    // form.addEventListener('submit', this._newWorkout.bind(this));

    // editWorkout.addEventListener('click', this._clickedWorkout);

    // editWorkout.addEventListener('click', this._showEditFrom);

    // editFrom.addEventListener('submit', this._editWorkout.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    // console.log(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    //Load saved markers
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));

    this._view();
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    if (editFrom.classList.contains('hidden')) {
      console.log('no');
    }
    inputDistance.focus();
  }

  _showEditFrom() {
    editFrom.classList.remove('hidden');
  }

  _hideForm() {
    //Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _hideEditForm() {
    //empty inputs
    editDistance.value =
      editCadence.value =
      editDuration.value =
      editElevation.value =
        '';
    editFrom.style.display = 'none';
    editFrom.classList.add('hidden');
    setTimeout(() => (editFrom.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _editWType() {
    editElevation
      .closest('.editform__row')
      .classList.toggle('editform__row--hidden');
    editCadence
      .closest('.editform__row')
      .classList.toggle('editform__row--hidden');
  }

  async _newWorkout(e) {
    try {
      const validInputs = (...inputs) =>
        inputs.every(inp => Number.isFinite(inp));
      const allPositive = (...inputs) => inputs.every(inp => inp > 0);

      e.preventDefault();

      //Get data from form
      const type = inputType.value;
      const distance = +inputDistance.value;
      const duration = +inputDuration.value;
      const { lat, lng } = this.#mapEvent.latlng;
      let workout;
      const res = await fetch(
        `https://geocode.xyz/${lat},${lng}?geoit=json&auth=${api_key}`
      );
      const data = await res.json();
      console.log(data);
      const place = `${data.city}, ${data.statename}`;

      //if workout is running then create running object
      if (type === 'running') {
        const cadence = +inputCadence.value;

        //Check if data is valid
        if (
          // !Number.isFinite(distance) ||
          // !Number.isFinite(duration) ||
          // !Number.isFinite(cadence)
          !validInputs(distance, duration, cadence) ||
          !allPositive(distance, duration, cadence)
        )
          return alert('Inputs have to be positive numbers!');

        workout = new Running(distance, [lat, lng], duration, cadence);
      }

      //If workout is cycling create cycling object
      if (type === 'cycling') {
        const elevation = +inputElevation.value;

        if (
          // !Number.isFinite(distance) ||
          // !Number.isFinite(duration) ||
          // !Number.isFinite(cadence)
          !validInputs(distance, duration, elevation) ||
          !allPositive(distance, duration)
        )
          return alert('Inputs must be positive numbers!');

        workout = new Cycling(distance, [lat, lng], duration, elevation);
      }
      workout.description += ` in ${place}`;
      workout.place = place;

      //add object to workout array
      this.#workouts.push(workout);

      //render workout on map
      this._renderWorkoutMarker(workout);

      //Render workout on list
      this._renderWorkout(workout);

      //Hide form + clear inout fields.
      this._hideForm();

      //Set local storage to all workouts
      this._setLocalStorage();
    } catch (err) {
      alert(err);
    }
  }

  _renderWorkoutMarker(workout) {
    let marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minwidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      );
    this.#markers.push(marker);
    marker
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <button class="button editform__btn" type="button">Edit</button>
    <button class="button delete__btn" type="button">
Delete
</button>
<button class="button deleteall__btn" type="button">Delete All</button>
<select class="sort">
  <option value="sort">Sort</option>
  <option value="distance">Distance</option>
  <option value="duration">Duration</option>
  <option value="date">Date</option>
</select>
<form class="popup hidden">
<div class="'text" id="text">Are you sure you want to delete this workout?</div>
<button class="yes" type="button">Yes</button>
<button class="no" type="button">No</button>
<button class="maybe" type="button">Maybe</button>
</form>
<form class="popupall hidden">
<div class="'text" id="text">Are you sure you want to delete all workouts?</div>
<button class="yesall" type="button">Yes</button>
<button class="noall" type="button">No</button>
<button class="maybeall" type="button">Maybe</button>
</form>

          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
         `;

    if (workout.type === 'running')
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;

    if (workout.type === 'cycling')
      html += `
  <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _handleClicks(e) {
    // this._hideForm();

    if (e.target.closest('.editform__btn')) {
      e.preventDefault();
      this._showEditFrom();
      e.target.closest('.editform__btn').classList.add('active');
    }

    if (e.target.closest('.workouts') && !e.target.closest('.form')) {
      this._moveToPopup(e);
      this._clickedWorkout(e);
    }

    if (!e.target.closest('.editform__btn') && !e.target.closest('.editform')) {
      this._hideEditForm();
    }

    if (e.target.closest('.delete__btn')) {
      this._hideForm();
      this._showCheck(e);
    }

    if (e.target.closest('.deleteall__btn')) {
      this._hideForm();
      this._showAllCheck(e);
    }

    if (e.target.closest('.sort')) {
      this._hideForm();
      this._field(e);
    }

    if (e.target.closest('.yes')) {
      this._deleteWorkout(e);
    }

    if (e.target.closest('.yesall')) {
      this._deleteAll(e);
    }

    if (e.target.closest('.no')) {
      this._check();
    }

    if (e.target.closest('.noall')) {
      this._checkAll();
    }

    if (e.target.closest('.maybe')) {
      alert('Jae Hee. It is time to do your stats homework');
    }

    if (e.target.closest('.maybeall')) {
      alert('Jae Hee. It is time to do your stats homework');
    }
  }

  _handleSubmits(e) {
    if (e.target.closest('.form')) {
      this._newWorkout(e);
    }

    if (e.target.closest('.editform')) {
      this._editWorkout(e);
    }
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    let workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _clickedWorkout(e) {
    if ('click') {
      e.preventDefault();

      let workOut = e.target.closest('.workout');

      if (!workOut) return false;

      let workout = this.#workouts.find(work => work.id === workOut.dataset.id);
      let index = this.#workouts.indexOf(workout);
      console.log(index);
      this.#workout2.push(index);
      // return index;
    } else return false;
  }

  _editWorkout(e) {
    // // prettier-ignore
    // const months2 = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    //new values
    e.preventDefault();
    let newType = editType.value;
    let newDistance = +editDistance.value;
    let newDuration = +editDuration.value;

    //finding old values
    let curWork = this.#workouts[this.#workout2[0]];

    if (newType === 'running') {
      let newCadence = +editCadence.value;

      if (
        !validInputs(
          newDistance,
          newDuration,
          newCadence || !allPositive(newCadence, newDuration, newDistance)
        )
      )
        return alert('All inputs must be positive numbers!');

      curWork.type = newType;
      curWork.distance = newDistance;
      curWork.duration = newDuration;
      curWork.cadence = newCadence;
      curWork.pace = newDuration / newDistance;

      curWork.description = `Running on ${curWork.curMonth} ${curWork.curDate} in ${curWork.place}`;
    }

    if (newType === 'cycling') {
      let newElevation = +editElevation.value;

      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(newDistance, newDuration, newElevation) ||
        !allPositive(newDistance, newDuration)
      )
        return alert('Inputs must be positive numbers!');

      curWork.type = newType;
      curWork.distance = newDistance;
      curWork.duration = newDuration;
      curWork.elevationGain = newElevation;
      curWork.speed = newDistance / (newDuration / 60);

      curWork.description = `Cycling on ${curWork.curMonth} ${curWork.curDate} in ${curWork.place}`;
    }

    this._renderWorkout(curWork);

    this._renderWorkoutMarker(curWork);

    this._hideEditForm();

    this._setLocalStorage();

    location.reload();

    this.#workout2.splice(0);
    console.log(this.#workout2);
  }

  _deleteWorkout(e) {
    e.preventDefault();

    let cWork = e.target.closest('.workout');

    let curWork = this.#workouts.find(work => work.id === cWork.dataset.id);
    console.log(curWork);
    let indexWork = this.#workouts.indexOf(curWork);

    //remove marker
    let curMark = this.#markers.find(
      mark =>
        mark._latlng.lat === curWork.coords[0] &&
        mark._latlng.lng === curWork.coords[1]
    );
    let indexMark = this.#markers.indexOf(curMark);

    this.#map.removeLayer(curMark);
    this.#markers.splice(indexMark, 1);

    let work = JSON.parse(localStorage.getItem('workouts'));
    console.log(work[indexWork]);
    cWork.remove();

    this.#workouts.splice(indexWork, 1);
    this._setLocalStorage();
  }

  _deleteAll(e) {
    e.preventDefault();

    let workouts = document.querySelectorAll('.workout');
    workouts.forEach(work => work.remove());
    this.#markers.forEach(mark => this.#map.removeLayer(mark));
    this.#markers.splice(0, this.#markers.length + 1);
    this.#workouts.splice(0, this.#workouts.length + 1);
    this._setLocalStorage();
  }

  _showCheck(e) {
    e.preventDefault();
    let pop = document.querySelector('.popup');
    pop.classList.remove('hidden');
  }

  _showAllCheck(e) {
    e.preventDefault();
    let popall = document.querySelector('.popupall');
    popall.classList.remove('hidden');
  }

  _check() {
    let pop = document.querySelector('.popup');
    pop.classList.add('hidden');
  }

  _checkAll() {
    let popall = document.querySelector('.popupall');
    popall.classList.add('hidden');
  }

  _field(e) {
    e.preventDefault();
    const fields = document.querySelector('.sort');
    let option = fields.value;
    let d = 'distance';

    console.log(option);
    if (option === 'distance') {
      this._sort(option);
    }

    if (option === 'duration') {
      this._sort(option);
    }

    if (option === 'date') {
      this._sort(option);
    }
  }

  _sort(val) {
    this.#workouts.sort((a, b) => a[val] - b[val]);
    this._setLocalStorage();
    location.reload();
  }

  _view() {
    if (this.#workouts.length === 0) return;
    let lats = this.#workouts.map(a => a.coords[0]);
    let longs = this.#workouts.map(a => a.coords[1]);
    console.log(lats, longs);

    let lo = [Math.min(...longs), Math.max(...longs)];
    let la = [Math.min(...lats), Math.max(...lats)];
    console.log(lo, la);

    let marginLat = (la[1] - la[0]) * 0.03;
    let marginLong = (lo[1] - lo[0]) * 0.03;
    console.log(marginLat, marginLong);

    const latLngBounds = [
      [la[0] - marginLat, lo[0] - marginLong],
      [la[1] + marginLat, lo[1] + marginLong],
    ];
    console.log(latLngBounds);

    this.#map.flyToBounds(latLngBounds);
  }

  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}

const app = new App();
