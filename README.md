[![reminder-test](https://github.com/tommykw/pull-request-reviewer-reminder-action/actions/workflows/test.yml/badge.svg)](https://github.com/tommykw/pull-request-reviewer-reminder-action/actions/workflows/test.yml)

# Pull Request reviewer reminder action

## Summary
Action to send Github mentions when there are pull requests pending for reviews. This action generated from [actions/typescript-action](https://github.com/actions/hello-world-javascript-action). The difference from Github's scheduled reminders is that if they haven't been reviewed within the specified time, they will send a mention to the github reviewers. This is useful if you need to check by a certain time.

## Setup
Create a file with the following content under `.github/workflows/pull-request-reviewer-reminder.yml`.

```yml
name: 'Pull request reviewer reminder'
on:
  schedule:
    # Check reviews every weekday, 10:00 and 17:00
    - cron: '0 10,17 * * 1-5'
    
jobs:
  pull-request-reviewer-reminder: 
    runs-on: ubuntu-latest
    steps:
      - uses: tommykw/pull-request-reviewer-reminder-action@v2
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }} # Required
          reminder_message: 'One business day has passed since the review started. Give priority to reviews as much as possible.' # Required. Messages to send to reviewers on Github.
          review_turnaround_hours: 24 # Required. This is the deadline for reviews. If this time is exceeded, a reminder wil be send.
```

## License
MIT