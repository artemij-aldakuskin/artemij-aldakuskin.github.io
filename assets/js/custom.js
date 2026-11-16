const form = document.querySelector('#contactForm');

if (form) {
  const fields = [...form.querySelectorAll('input')];
  const submit = form.querySelector('[type="submit"]');
  const results = document.querySelector('#contactResults');
  const phone = form.elements.phone;

  function formatPhone() {
    let digits = phone.value.replace(/\D/g, '');
    if (phone.value.trimStart().startsWith('+') || digits.startsWith('370') && digits.length > 8) {
      digits = digits.slice(3);
    }
    digits = digits.slice(0, 8);
    phone.value = digits ? '+370 ' + digits.slice(0, 3) + (digits.length > 3 ? ' ' + digits.slice(3) : '') : '';
  }

  function validationMessage(field) {
    const value = field.value.trim();

    if (field.type === 'number' && (field.validity.badInput || value && !field.validity.valid)) {
      return 'Įveskite sveiką skaičių nuo 1 iki 10.';
    }
    if (!value) return 'Užpildykite šį lauką.';
    if (['firstName', 'lastName'].includes(field.name) && !/^\p{L}+$/u.test(value)) {
      return 'Įveskite tik raides.';
    }
    if (field.type === 'email' && (field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
      return 'Įveskite tinkamą el. pašto adresą.';
    }
    if (field === phone && !/^\+370 6\d{2} \d{5}$/.test(value)) {
      return 'Įveskite numerį formatu +370 6xx xxxxx.';
    }
    return '';
  }

  function validate(field) {
    const message = validationMessage(field);
    document.getElementById(field.id + 'Error').textContent = message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    submit.disabled = fields.some(validationMessage);
  }

  fields.forEach(field => {
    field.addEventListener('input', () => {
      if (field === phone) formatPhone();
      validate(field);
    });
    field.addEventListener('blur', () => validate(field));
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (fields.some(validationMessage)) return;

    const data = Object.fromEntries(fields.map(field => [
      field.name,
      field.type === 'number' ? field.valueAsNumber : field.value.trim()
    ]));
    console.log(data);

    const average = (data.design + data.content + data.navigation) / 3;
    const lines = fields.map(field => {
      const label = field === phone ? 'Tel. Numeris' : field.labels[0].textContent;
      return label + ': ' + data[field.name];
    });
    lines.push(data.firstName + ' ' + data.lastName + ': ' + average.toLocaleString('lt-LT', {
      maximumFractionDigits: 2
    }));

    results.replaceChildren(...lines.map(line => {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      return paragraph;
    }));
  });

  form.addEventListener('reset', () => {
    results.replaceChildren();
    fields.forEach(field => {
      document.getElementById(field.id + 'Error').textContent = '';
      field.removeAttribute('aria-invalid');
    });
    submit.disabled = true;
  });
}

const board = document.querySelector('#competencyBoard');

if (board) {
  const skills = [
    { name: 'HTML ir CSS', status: 'done', xp: 50 },
    { name: 'JavaScript', status: 'learning', xp: 50 },
    { name: 'Python', status: 'learning', xp: 50 },
    { name: 'SQL', status: 'planned', xp: 40 },
    { name: 'C ir C++', status: 'planned', xp: 60 },
    { name: 'Git', status: 'planned', xp: 30 },
    { name: 'Automatizuotas testavimas', status: 'planned', xp: 40 }
  ];
  const statuses = {
    planned: 'Planuojama',
    learning: 'Mokomasi',
    done: 'Atlikta'
  };
  const levels = [
    { min: 0, rank: 'Pradedantysis' },
    { min: 50, rank: 'Praktikantas' },
    { min: 150, rank: 'Specialistas' },
    { min: 300, rank: 'Profesionalas' }
  ];
  const storageKey = 'cv-competency-statuses';
  const columns = Object.fromEntries([...board.querySelectorAll('[data-status]')].map(column => [
    column.dataset.status, column
  ]));
  const achievements = [...document.querySelectorAll('#achievements .achievement')];

  function restoreStatuses() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey));
    } catch {
      return;
    }
    if (!saved) return;

    skills.forEach(skill => {
      const status = saved[skill.name];
      if (Object.hasOwn(statuses, status)) skill.status = status;
    });
  }

  function renderSkills() {
    Object.values(columns).forEach(column => column.replaceChildren());

    skills.forEach(skill => {
      const card = document.createElement('article');
      card.className = 'competency-card';
      const title = document.createElement('strong');
      title.textContent = skill.name + ' · ' + skill.xp + ' XP';

      const select = document.createElement('select');
      select.className = 'form-select';
      select.setAttribute('aria-label', skill.name + ' būsena');
      Object.entries(statuses).forEach(([status, label]) => {
        select.add(new Option(label, status));
      });
      select.value = skill.status;
      select.addEventListener('change', () => {
        skill.status = select.value;
        columns[skill.status].append(card);
        updateProgress();
        localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(
          skills.map(item => [item.name, item.status])
        )));
      });

      card.append(title, select);
      columns[skill.status].append(card);
    });
  }

  function updateAvatar(level) {
    const avatar = document.querySelector('#levelAvatar');
    if (level === 4) {
      avatar.src = 'assets/img/level-4.svg';
    } else if (level === 3) {
      avatar.src = 'assets/img/level-3.svg';
    } else if (level === 2) {
      avatar.src = 'assets/img/level-2.svg';
    } else {
      avatar.src = 'assets/img/level-1.svg';
    }
  }

  function updateAchievements(completed, level) {
    const unlocked = [completed >= 1, completed >= 4, level === 4];
    achievements.forEach((achievement, index) => {
      achievement.classList.toggle('is-unlocked', unlocked[index]);
      achievement.querySelector('span').textContent = unlocked[index] ? 'Atrakintas' : 'Užrakintas';
    });
  }

  function updateProgress() {
    const completed = skills.filter(skill => skill.status === 'done');
    const xp = completed.reduce((total, skill) => total + skill.xp, 0);
    const index = levels.findLastIndex(level => xp >= level.min);
    const level = levels[index];
    const next = levels[index + 1];
    const progress = next ? (xp - level.min) / (next.min - level.min) * 100 : 100;
    const percent = Math.round(completed.length / skills.length * 100);

    document.querySelector('#levelInfo').textContent = xp + ' XP · ' + (index + 1) + ' lygis · ' + level.rank;
    document.querySelector('#levelProgress').value = progress;
    document.querySelector('#skillStats').textContent =
      'Įgūdžių: ' + skills.length + ' · Atlikta: ' + completed.length + ' (' + percent + ' %)';
    updateAvatar(index + 1);
    updateAchievements(completed.length, index + 1);
  }

  restoreStatuses();
  renderSkills();
  updateProgress();
}
