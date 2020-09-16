import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  const octokit = github.getOctokit(core.getInput('github_token'))
  const message = core.getInput('message')
  const withinHours = parseInt(core.getInput('within_hours'), 10)

  core.info(`${message}`)
  core.info(`${withinHours}`)

  try {
    const {data: pullRequests} = await octokit.pulls.list({
      ...github.context.repo,
      state: 'open'
    })

    for (const pr of pullRequests) {
      core.info(`pr title ${pr.title}`)

      const prRequestedReponse = await octokit.graphql(
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

      const currentTime = new Date().getTime()
      const response = prRequestedReponse as PullRequestResponse
      if (response.repository.pullRequest.timelineItems.nodes.length === 0) {
        continue
      }

      const prCreatedAt =
        response.repository.pullRequest.timelineItems.nodes[0].createdAt

      const pullRequestCreatedTime =
        new Date(prCreatedAt).getTime() + 60 * 60 * withinHours

      core.info(
        `currentTime: ${currentTime} pullRequestCreatedTime: ${pullRequestCreatedTime}`
      )
      if (currentTime < pullRequestCreatedTime) {
        continue
      }

      const {data: pullRequest} = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: pr.number
      })

      if (response.repository.pullRequest.reviews.nodes.length > 0) {
        continue
      }

      core.info(
        `PullRequestReview createdAt: ${response.repository.pullRequest.reviews.nodes[0].createdAt}`
      )

      const reviewers = pullRequest.requested_reviewers
        .map(rr => `@${rr.login}`)
        .join(', ')

      await octokit.issues.createComment({
        ...github.context.repo,
        issue_number: pullRequest.number,
        body: `${reviewers} \n${message}`
      })
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
    }
  }
}

interface Node {
  __typename: string
  createdAt: string
}

run()
