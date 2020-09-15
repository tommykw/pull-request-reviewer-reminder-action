import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  const octokit = github.getOctokit(core.getInput('github_token'))

  try {
    const {data: pullRequests} = await octokit.pulls.list({
      ...github.context.repo,
      state: 'open'
    })

    for (const pr of pullRequests) {
      core.info(`title ${pr.title}`)

      const prRequestedReponse = await octokit.graphql(
        `
        query($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            pullRequest(number: $number) {
              timelineItems(first: 20, itemTypes: [REVIEW_REQUESTED_EVENT]) {
                nodes {
                  __typename
                  ... on ReviewRequestedEvent {
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
      const response = prRequestedReponse as PrRequestedResponse

      if (response.repository.pullRequest.timelineItems.nodes.length === 0) {
        continue
      }

      const prCreatedAt =
        response.repository.pullRequest.timelineItems.nodes[0].createdAt

      const pullRequestCreatedTime =
        new Date(prCreatedAt).getTime() + 60 * 60 * 24

      core.info(`${currentTime} > ${pullRequestCreatedTime}`)
      if (currentTime > pullRequestCreatedTime) {
        continue
      }

      const {data: pullRequest} = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: pr.number
      })

      core.info(`review comments ${pullRequest.review_comments}`)
      if (pullRequest.review_comments !== 0) {
        continue
      }

      const reviewers = pullRequest.requested_reviewers
        .map(rr => `@${rr.login}`)
        .join(', ')

      await octokit.issues.createComment({
        ...github.context.repo,
        issue_number: pullRequest.number,
        body: `${reviewers} \nレビュー開始から1営業日経過しました。レビューをなるべく優先しましょう。`
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

interface PrRequestedResponse {
  repository: {
    pullRequest: {
      timelineItems: {
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
