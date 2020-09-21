import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  const octokit = github.getOctokit(core.getInput('github_token'))
  const reminderMessage = core.getInput('reminder_message')
  const reviewTurnaroundHours = parseInt(
    core.getInput('review_turnaround_hours'),
    10
  )

  try {
    const {data: pullRequests} = await octokit.pulls.list({
      ...github.context.repo,
      state: 'open'
    })

    for (const pr of pullRequests) {
      core.info(`pr title: ${pr.title}`)

      const pullRequestResponse = await octokit.graphql<PullRequestResponse>(
        `
        query($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            pullRequest(number: $number) {
              timelineItems(first: 50, itemTypes: [REVIEW_REQUESTED_EVENT]) {
                nodes {
                  __typename
                  ... on ReviewRequestedEvent {
                    createdAt
                  }
                }
              },
              reviews(first: 50, states: [APPROVED, CHANGES_REQUESTED, COMMENTED]) {
                nodes {
                  __typename
                  ... on PullRequestReview {
                    createdAt
                  }
                }
              },
              comments(first: 100) {
                nodes {
                  body
                }
              }
            }
          }
        }
        `,
        {
          owner: github.context.repo.owner,
          name: github.context.repo.repo,
          number: pr.number
        }
      )

      if (pullRequestResponse.repository.pullRequest.reviews.nodes.length > 0) {
        continue
      }

      if (
        pullRequestResponse.repository.pullRequest.timelineItems.nodes
          .length === 0
      ) {
        continue
      }

      const pullRequestCreatedAt =
        pullRequestResponse.repository.pullRequest.timelineItems.nodes[0]
          .createdAt

      const currentTime = new Date().getTime()
      const reviewByTime =
        new Date(pullRequestCreatedAt).getTime() +
        1000 * 60 * 60 * reviewTurnaroundHours

      core.info(`currentTime: ${currentTime} reviewByTime: ${reviewByTime}`)
      if (currentTime < reviewByTime) {
        continue
      }

      const {data: pullRequest} = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: pr.number
      })

      const reviewers = pullRequest.requested_reviewers
        .map(rr => `@${rr.login}`)
        .join(', ')

      const addReminderComment = `${reviewers} \n${reminderMessage}`
      const hasReminderComment =
        pullRequestResponse.repository.pullRequest.comments.nodes.filter(
          node => {
            return node.body.match(RegExp(reminderMessage)) != null
          }
        ).length > 0

      core.info(`hasReminderComment: ${hasReminderComment}`)
      if (hasReminderComment) {
        continue
      }

      await octokit.issues.createComment({
        ...github.context.repo,
        issue_number: pullRequest.number,
        body: addReminderComment
      })

      core.info(
        `create comment issue_number: ${pullRequest.number} body: ${reviewers} ${addReminderComment}`
      )
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

interface PullRequestResponse {
  repository: {
    pullRequest: {
      timelineItems: {
        nodes: Node[]
      }
      reviews: {
        nodes: Node[]
      }
      comments: {
        nodes: {
          body: string
        }[]
      }
    }
  }
}

interface Node {
  __typename: string
  createdAt: string
}

run()
