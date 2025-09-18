# src/edsale/crew.py
from __future__ import annotations

from crewai import Agent, Task as CrewTask, Crew, Process
from crewai.project import CrewBase, agent as agent_deco, task as task_deco, crew as crew_deco


class Edsale(CrewBase):
    """
    Crew wiring for Coco's project.
    NOTE: We alias decorators to avoid shadowing by any variable named agent/task/crew.
    """

    # ----------------- AGENTS -----------------
    @agent_deco
    def coco_ambassador(self) -> Agent:
        return Agent(config=self.agents_config["coco_ambassador"], verbose=True)

    @agent_deco
    def china_ed_explainer(self) -> Agent:
        return Agent(config=self.agents_config["china_ed_explainer"], verbose=True)

    @agent_deco
    def client_emailer(self) -> Agent:
        return Agent(config=self.agents_config["client_emailer"], verbose=True)

    @agent_deco
    def bootcamp_faq(self) -> Agent:
        return Agent(config=self.agents_config["bootcamp_faq"], verbose=True)

    # If you still keep the sample agents in YAML, you may leave these:
    @agent_deco
    def researcher(self) -> Agent:
        return Agent(config=self.agents_config.get("researcher", {}), verbose=True)

    @agent_deco
    def reporting_analyst(self) -> Agent:
        return Agent(config=self.agents_config.get("reporting_analyst", {}), verbose=True)

    # ----------------- TASKS ------------------
    @task_deco
    def introduce_coco(self) -> CrewTask:
        return CrewTask(config=self.tasks_config["introduce_coco"], agent=self.coco_ambassador())

    @task_deco
    def explain_china_edu(self) -> CrewTask:
        return CrewTask(config=self.tasks_config["explain_china_edu"], agent=self.china_ed_explainer())

    @task_deco
    def draft_client_email(self) -> CrewTask:
        return CrewTask(config=self.tasks_config["draft_client_email"], agent=self.client_emailer())

    @task_deco
    def answer_bootcamp_faq(self) -> CrewTask:
        return CrewTask(config=self.tasks_config["answer_bootcamp_faq"], agent=self.bootcamp_faq())

    # Optional sample tasks if you kept them:
    @task_deco
    def research_task(self) -> CrewTask:
        if "research_task" not in self.tasks_config:
            # Return a no-op task if it doesn't exist
            return CrewTask(description="(noop)", expected_output="", agent=self.researcher())
        return CrewTask(config=self.tasks_config["research_task"], agent=self.researcher())

    @task_deco
    def reporting_task(self) -> CrewTask:
        if "reporting_task" not in self.tasks_config:
            return CrewTask(description="(noop)", expected_output="", agent=self.reporting_analyst())
        return CrewTask(config=self.tasks_config["reporting_task"], agent=self.reporting_analyst())

    # ----------------- CREW -------------------
    @crew_deco
    def crew(self) -> Crew:
        """Default run executes the four Coco tasks sequentially."""
        return Crew(
            agents=[
                self.coco_ambassador(),
                self.china_ed_explainer(),
                self.client_emailer(),
                self.bootcamp_faq(),
            ],
            tasks=[
                self.introduce_coco(),
                self.explain_china_edu(),
                self.draft_client_email(),
                self.answer_bootcamp_faq(),
            ],
            process=Process.sequential,
            verbose=True,
        )
