// Curated problem definitions with full descriptions, examples, starter code & test cases
export const DETAILED_PROBLEMS = {
  "nc-1": {
    id: "nc-1",
    number: 1,
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays & Hashing",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "nums[1] + nums[2] == 6, we return [1, 2]."
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]"
      }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    starterTemplates: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your solution here
    
};`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here
        pass`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
      java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`
    },
    sampleTestCases: [
      {
        id: 1,
        input: "[2, 7, 11, 15]\n9",
        expected: "[0, 1]",
        fnCallJs: "twoSum([2, 7, 11, 15], 9)",
        fnCallPy: "Solution().twoSum([2, 7, 11, 15], 9)"
      },
      {
        id: 2,
        input: "[3, 2, 4]\n6",
        expected: "[1, 2]",
        fnCallJs: "twoSum([3, 2, 4], 6)",
        fnCallPy: "Solution().twoSum([3, 2, 4], 6)"
      }
    ],
    hiddenTestCases: [
      {
        id: 3,
        input: "[3, 3]\n6",
        expected: "[0, 1]",
        fnCallJs: "twoSum([3, 3], 6)",
        fnCallPy: "Solution().twoSum([3, 3], 6)"
      },
      {
        id: 4,
        input: "[1, 5, 8, 3, 2]\n10",
        expected: "[1, 2]", // 2 + 8 = 10 -> indices 1 and 2 (or 2 and 1)
        fnCallJs: "twoSum([1, 5, 8, 3, 2], 10)",
        fnCallPy: "Solution().twoSum([1, 5, 8, 3, 2], 10)"
      }
    ]
  },

  "nc-217": {
    id: "nc-217",
    number: 217,
    title: "Contains Duplicate",
    difficulty: "Easy",
    topic: "Arrays & Hashing",
    description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.`,
    examples: [
      {
        input: "nums = [1,2,3,1]",
        output: "true"
      },
      {
        input: "nums = [1,2,3,4]",
        output: "false"
      },
      {
        input: "nums = [1,1,1,3,3,4,3,2,4,2]",
        output: "true"
      }
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9"
    ],
    starterTemplates: {
      javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function containsDuplicate(nums) {
    // Write your solution here
    
};`,
      python: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        # Write your solution here
        pass`,
      cpp: `#include <vector>
#include <unordered_set>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Write your solution here
        return false;
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Write your solution here
        return false;
    }
}`
    },
    sampleTestCases: [
      {
        id: 1,
        input: "[1, 2, 3, 1]",
        expected: "true",
        fnCallJs: "containsDuplicate([1, 2, 3, 1])",
        fnCallPy: "Solution().containsDuplicate([1, 2, 3, 1])"
      },
      {
        id: 2,
        input: "[1, 2, 3, 4]",
        expected: "false",
        fnCallJs: "containsDuplicate([1, 2, 3, 4])",
        fnCallPy: "Solution().containsDuplicate([1, 2, 3, 4])"
      }
    ],
    hiddenTestCases: [
      {
        id: 3,
        input: "[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]",
        expected: "true",
        fnCallJs: "containsDuplicate([1, 1, 1, 3, 3, 4, 3, 2, 4, 2])",
        fnCallPy: "Solution().containsDuplicate([1, 1, 1, 3, 3, 4, 3, 2, 4, 2])"
      }
    ]
  },

  "nc-242": {
    id: "nc-242",
    number: 242,
    title: "Valid Anagram",
    difficulty: "Easy",
    topic: "Arrays & Hashing",
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      {
        input: "s = \"anagram\", t = \"nagaram\"",
        output: "true"
      },
      {
        input: "s = \"rat\", t = \"car\"",
        output: "false"
      }
    ],
    constraints: [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters."
    ],
    starterTemplates: {
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isAnagram(s, t) {
    // Write your solution here
    
};`,
      python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # Write your solution here
        pass`,
      cpp: `#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        // Write your solution here
        return false;
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean isAnagram(String s, String t) {
        // Write your solution here
        return false;
    }
}`
    },
    sampleTestCases: [
      {
        id: 1,
        input: "\"anagram\"\n\"nagaram\"",
        expected: "true",
        fnCallJs: "isAnagram(\"anagram\", \"nagaram\")",
        fnCallPy: "Solution().isAnagram(\"anagram\", \"nagaram\")"
      },
      {
        id: 2,
        input: "\"rat\"\n\"car\"",
        expected: "false",
        fnCallJs: "isAnagram(\"rat\", \"car\")",
        fnCallPy: "Solution().isAnagram(\"rat\", \"car\")"
      }
    ],
    hiddenTestCases: [
      {
        id: 3,
        input: "\"a\"\n\"ab\"",
        expected: "false",
        fnCallJs: "isAnagram(\"a\", \"ab\")",
        fnCallPy: "Solution().isAnagram(\"a\", \"ab\")"
      }
    ]
  },

  "nc-121": {
    id: "nc-121",
    number: 121,
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Sliding Window",
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return \`0\`.`,
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation: "In this case, no transactions are done and the max profit = 0."
      }
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4"
    ],
    starterTemplates: {
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
    // Write your solution here
    
};`,
      python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        # Write your solution here
        pass`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Write your solution here
        return 0;
    }
};`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        // Write your solution here
        return 0;
    }
}`
    },
    sampleTestCases: [
      {
        id: 1,
        input: "[7, 1, 5, 3, 6, 4]",
        expected: "5",
        fnCallJs: "maxProfit([7, 1, 5, 3, 6, 4])",
        fnCallPy: "Solution().maxProfit([7, 1, 5, 3, 6, 4])"
      },
      {
        id: 2,
        input: "[7, 6, 4, 3, 1]",
        expected: "0",
        fnCallJs: "maxProfit([7, 6, 4, 3, 1])",
        fnCallPy: "Solution().maxProfit([7, 6, 4, 3, 1])"
      }
    ],
    hiddenTestCases: [
      {
        id: 3,
        input: "[2, 4, 1]",
        expected: "2",
        fnCallJs: "maxProfit([2, 4, 1])",
        fnCallPy: "Solution().maxProfit([2, 4, 1])"
      }
    ]
  },

  "nc-206": {
    id: "nc-206",
    number: 206,
    title: "Reverse Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    description: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.`,
    examples: [
      {
        input: "head = [1,2,3,4,5]",
        output: "[5,4,3,2,1]",
        explanation: "The linked list is reversed from 1->2->3->4->5 to 5->4->3->2->1."
      },
      {
        input: "head = [1,2]",
        output: "[2,1]"
      },
      {
        input: "head = []",
        output: "[]"
      }
    ],
    constraints: [
      "The number of nodes in the list is the range [0, 5000].",
      "-5000 <= Node.val <= 5000"
    ],
    starterTemplates: {
      javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function reverseList(head) {
    let prev = null;
    let curr = head;
    while (curr !== null) {
        let nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
};`,
      python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head):
        prev = None
        curr = head
        while curr:
            next_node = curr.next
            curr.next = prev
            prev = curr
            curr = next_node
        return prev`,
      cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr != nullptr) {
            ListNode* next = curr->next;
            curr->next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
};`,
      java: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
}`
    },
    sampleTestCases: [
      {
        id: 1,
        input: "[1, 2, 3, 4, 5]",
        expected: "[5, 4, 3, 2, 1]",
        fnCallJs: "JSON.stringify((function(){ function toArr(node){ let arr=[]; while(node){ arr.push(node.val); node=node.next; } return arr; } function fromArr(arr){ let dummy={next:null}, cur=dummy; for(let v of arr){ cur.next={val:v,next:null}; cur=cur.next; } return dummy.next; } return toArr(reverseList(fromArr([1,2,3,4,5]))); })())",
        fnCallPy: "None"
      },
      {
        id: 2,
        input: "[1, 2]",
        expected: "[2, 1]",
        fnCallJs: "JSON.stringify((function(){ function toArr(node){ let arr=[]; while(node){ arr.push(node.val); node=node.next; } return arr; } function fromArr(arr){ let dummy={next:null}, cur=dummy; for(let v of arr){ cur.next={val:v,next:null}; cur=cur.next; } return dummy.next; } return toArr(reverseList(fromArr([1,2]))); })())",
        fnCallPy: "None"
      }
    ],
    hiddenTestCases: []
  },

  "nc-141": {
    id: "nc-141",
    number: 141,
    title: "Linked List Cycle",
    difficulty: "Easy",
    topic: "Linked List",
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the \`next\` pointer. Internally, \`pos\` is used to denote the index of the node that tail's \`next\` pointer is connected to (**0-indexed**). It is \`-1\` if there is no cycle.

Return \`true\` *if there is a cycle in the linked list*. Otherwise, return \`false\`.`,
    examples: [
      {
        input: "head = [3,2,0,-4], pos = 1",
        output: "true",
        explanation: "There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed)."
      },
      {
        input: "head = [1,2], pos = 0",
        output: "true",
        explanation: "There is a cycle in the linked list, where the tail connects to the 0th node."
      },
      {
        input: "head = [1], pos = -1",
        output: "false",
        explanation: "There is no cycle in the linked list."
      }
    ],
    constraints: [
      "The number of the nodes in the list is in the range [0, 10^4].",
      "-10^5 <= Node.val <= 10^5",
      "pos is -1 or a valid index in the linked-list."
    ],
    starterTemplates: {
      javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {boolean}
 */
function hasCycle(head) {
    if (!head || !head.next) return false;
    let slow = head;
    let fast = head.next;
    while (slow !== fast) {
        if (!fast || !fast.next) return false;
        slow = slow.next;
        fast = fast.next.next;
    }
    return true;
};`,
      python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None

class Solution:
    def hasCycle(self, head) -> bool:
        slow, fast = head, head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast:
                return True
        return False`,
      cpp: `class Solution {
public:
    bool hasCycle(ListNode *head) {
        if (!head || !head.next) return false;
        ListNode *slow = head;
        ListNode *fast = head->next;
        while (slow != fast) {
            if (!fast || !fast.next) return false;
            slow = slow.next;
            fast = fast.next.next;
        }
        return true;
    }
};`,
      java: `public class Solution {
    public boolean hasCycle(ListNode head) {
        if (head == null || head.next == null) return false;
        ListNode slow = head;
        ListNode fast = head.next;
        while (slow != fast) {
            if (fast == null || fast.next == null) return false;
            slow = slow.next;
            fast = fast.next.next;
        }
        return true;
    }
}`
    },
    sampleTestCases: [
      {
        id: 1,
        input: "[3, 2, 0, -4], pos = 1",
        expected: "true",
        fnCallJs: "(function(){ let n1={val:3}, n2={val:2}, n3={val:0}, n4={val:-4}; n1.next=n2; n2.next=n3; n3.next=n4; n4.next=n2; return hasCycle(n1); })()",
        fnCallPy: "None"
      },
      {
        id: 2,
        input: "[1], pos = -1",
        expected: "false",
        fnCallJs: "(function(){ let n1={val:1, next:null}; return hasCycle(n1); })()",
        fnCallPy: "None"
      }
    ],
    hiddenTestCases: []
  }
};

/**
 * Get problem details by ID or problem object.
 * If detailed specs aren't manually written yet, creates dynamic fallback templates!
 */
export function getProblemDetails(problem) {
  if (!problem) return null;
  const id = problem.id || `nc-${problem.number}`;
  
  if (DETAILED_PROBLEMS[id]) {
    return { ...problem, ...DETAILED_PROBLEMS[id] };
  }

  if (problem.number && DETAILED_PROBLEMS[`nc-${problem.number}`]) {
    return { ...problem, ...DETAILED_PROBLEMS[`nc-${problem.number}`] };
  }

  const matchedByTitle = Object.values(DETAILED_PROBLEMS).find(
    p => p.title?.toLowerCase() === problem.title?.toLowerCase()
  );
  if (matchedByTitle) {
    return { ...problem, ...matchedByTitle };
  }

  // Fallback template for any problem in the 150 list
  const safeFnName = (problem.title || "solution")
    .replace(/[^a-zA-Z0-9]/g, " ")
    .trim()
    .split(/\s+/)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  return {
    ...problem,
    description: `Solve the problem: **${problem.title}** (${problem.topic || "Algorithms"}).\n\nVisit [LeetCode Problem Page](${problem.url || "#"}) to read full specifications and examples.`,
    examples: [
      {
        input: "See official LeetCode problem description",
        output: "Expected return value"
      }
    ],
    constraints: [
      "Refer to LeetCode constraints for time & space bounds."
    ],
    starterTemplates: {
      javascript: `/**\n * ${problem.title}\n */\nfunction ${safeFnName}(input) {\n    // Write your code here\n    \n};`,
      python: `class Solution:\n    def ${safeFnName}(self, input):\n        # Write your code here\n        pass`,
      cpp: `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void ${safeFnName}() {\n        // Write code\n    }\n};`,
      java: `class Solution {\n    public void ${safeFnName}() {\n        // Write code\n    }\n}`
    },
    sampleTestCases: [
      {
        id: 1,
        input: "Custom input",
        expected: "Custom output",
        fnCallJs: `${safeFnName}()`,
        fnCallPy: `Solution().${safeFnName}()`
      }
    ],
    hiddenTestCases: []
  };
}
