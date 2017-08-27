# coding=utf-8
from datetime import datetime
import time

from flask import Flask, jsonify, render_template, make_response, request, redirect, url_for

app = Flask(__name__)


class State:
    def __init__(self):
        pass

    entry = 'entry'
    ready = 'ready'
    answer = 'answer'
    answer_check = 'answer_check'


current_state = None
collector_list = None
collector_name_list = None
eliminated_list = None
participant_list = []
answer_list = None
current_correct_num = None
current_quiz_id = None
answer_start_time = None
is_special = None


def init():
    global current_state, collector_list, collector_name_list, eliminated_list, current_quiz_id, answer_list, \
        current_correct_num, is_special, answer_start_time
    current_state = State.entry
    collector_list = []
    collector_name_list = []
    eliminated_list = []
    current_quiz_id = ''
    answer_list = {}
    current_correct_num = None
    is_special = False
    answer_start_time = 0


init()


def is_eliminated(name):
    global eliminated_list
    return name in eliminated_list


def set_cookie(content, key, val):
    max_age = 60 * 60 * 24
    expires = int(datetime.now().strftime('%s')) + max_age
    response = make_response(content)

    response.set_cookie(key, value=val, max_age=max_age, expires=expires, path='/')

    return response


def update_by_name():
    global participant_list
    name = request.cookies.get('name', None)
    if name not in participant_list:
        participant_list.append(name)


@app.route('/', methods=['GET'])
def index():
    name = request.cookies.get('name', None)
    _answer = request.cookies.get('answer', None)
    error = request.cookies.get('error', None)

    if name is None:
        content = render_template('input.html')
    else:
        content = render_template('index.html', name=name, answer=_answer, error=error)
        update_by_name()

    response = make_response(content)
    response.set_cookie('answer', '', expires=0)
    response.set_cookie('error', '', expires=0)

    return response


@app.route('/entry', methods=['POST'])
def entry():
    global current_state, participant_list

    name = request.form['name']
    if current_state is not State.entry:
        content = redirect(url_for('index'))
        response = set_cookie(content, 'error', '受付時間外です。')
        return response

    if name in participant_list:
        content = redirect(url_for('index'))
        response = set_cookie(content, 'error', '名前がすでに使われています。')
        return response

    participant_list.append(name)
    content = redirect(url_for('index'))
    response = set_cookie(content, 'name', name)

    return response


@app.route('/ready', methods=['GET'])
def ready():
    global current_state, current_quiz_id
    update_by_name()
    name = request.cookies.get('name', None)

    if current_state is State.ready \
            and not is_eliminated(name) \
            and name in participant_list \
            and current_quiz_id is not None:
        return render_template('ready.html', quiz_id=current_quiz_id)

    return redirect(url_for('index'))


@app.route('/answer', methods=['POST'])
def answer():
    global answer_list, current_state, collector_list, collector_name_list, current_quiz_id, answer_start_time, \
        current_correct_num, eliminated_list
    name = request.cookies.get('name', None)
    quiz_id = request.json['quiz_id']
    _answer = request.json['answer']

    if is_eliminated(name) or current_state != State.answer or current_quiz_id != quiz_id:
        return ''

    if name not in answer_list[_answer]:
        answer_list[_answer].append(name)

    if current_correct_num is _answer:
        is_dup = False
        for collector in collector_list:
            if collector['name'] == name:
                collector['time'] = round((time.time() * 1000 - answer_start_time) / 1000, 2)
                is_dup = True

        if not is_dup:
            collector_list.append({
                'name': name,
                'time': round((time.time() * 1000 - answer_start_time) / 1000, 2)
            })

        if name not in collector_name_list:
            collector_name_list.append(name)

    else:
        eliminated_list.append(name)

    response = set_cookie('answer', 'answer', '{}'.format(_answer + 1))

    return response


@app.route('/bridge/ready', methods=['POST'])
def bridge_ready():
    global answer_list, current_state, current_quiz_id, current_correct_num, collector_list, collector_name_list, \
        is_special
    current_correct_num = request.json['correct_num']
    current_quiz_id = request.json['quiz_id']
    is_special = request.json['is_special']
    collector_list = []
    collector_name_list = []
    answer_list = [[], [], [], []]
    current_state = State.ready

    return jsonify({
        'state': current_state,
    })


@app.route('/bridge/answer/start', methods=['POST'])
def bridge_answer_start():
    global current_state, answer_start_time
    current_state = State.answer
    answer_start_time = request.json['timestamp']

    return jsonify({
        'state': current_state,
    })


@app.route('/bridge/answer/check', methods=['GET'])
def bridge_answer_check():
    global answer_list, current_state, current_quiz_id, is_special, eliminated_list, participant_list, collector_list, \
        collector_name_list
    current_state = State.answer_check

    if is_special:
        collector = collector_list[:10]
    else:
        collector = collector_list[-10:]
        if len(collector) != 0:
            eliminated_list.append(collector[-1]['name'])

    diff_list = list(set(participant_list) - set(collector_name_list))
    for diff in diff_list:
        if diff not in eliminated_list:
            eliminated_list.append(diff)

    return jsonify({
        'state': current_state,
        'answer_list': [len(answer_list[0]), len(answer_list[1]), len(answer_list[2]), len(answer_list[3])],
        'correct_list': collector
    })


@app.route('/bridge/init', methods=['GET'])
def bridge_init():
    init()
    return ''


@app.route('/bridge/reset_period', methods=['GET'])
def reset_period():
    init()
    return ''


@app.route('/bridge/rebirth', methods=['GET'])
def bridge_rebirth():
    global eliminated_list
    eliminated_list = []

    return ''


if __name__ == '__main__':
    app.run()
